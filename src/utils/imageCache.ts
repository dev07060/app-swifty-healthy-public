import { appSettings } from '../config';
import {
  type ImageCompressionOptions,
  compressImage,
} from './imageCompression';
import { ImageMemoryManager } from './imageProcessing';

export interface CachedImage {
  uri: string;
  compressedUri?: string;
  size: number;
  compressedSize?: number;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

export interface ImageCacheOptions extends ImageCompressionOptions {
  enableCompression?: boolean;
  cacheKey?: string;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Enhanced image cache with memory management and compression
 */
export class ImageCache {
  private static cache = new Map<string, CachedImage>();
  private static readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB cache limit
  private static readonly MAX_CACHE_ENTRIES = 20;
  private static readonly CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

  /**
   * Get cached image with automatic compression and memory management
   */
  static async getCachedImage(
    imageUri: string,
    options: ImageCacheOptions = {},
  ): Promise<{ uri: string; size: number; fromCache: boolean }> {
    const {
      enableCompression = true,
      cacheKey = imageUri,
      priority = 'normal',
      ...compressionOptions
    } = options;

    try {
      // Check if image is already cached
      const cached = ImageCache.cache.get(cacheKey);
      if (cached && ImageCache.isCacheValid(cached)) {
        // Update access statistics
        cached.accessCount++;
        cached.lastAccessed = Date.now();

        if (appSettings.debugMode) {
          console.log('📦 Image cache hit:', {
            cacheKey,
            size: cached.compressedSize || cached.size,
            accessCount: cached.accessCount,
          });
        }

        return {
          uri: cached.compressedUri || cached.uri,
          size: cached.compressedSize || cached.size,
          fromCache: true,
        };
      }

      // Check memory availability before processing
      const estimatedSize = await ImageCache.estimateImageSize(imageUri);
      if (!ImageMemoryManager.canAllocate(estimatedSize)) {
        // Try to free up memory
        await ImageCache.cleanup(estimatedSize);

        // Check again after cleanup
        if (!ImageMemoryManager.canAllocate(estimatedSize)) {
          console.warn(
            '⚠️ Insufficient memory for image processing, using original',
          );
          return { uri: imageUri, size: estimatedSize, fromCache: false };
        }
      }

      // Track memory usage
      ImageMemoryManager.trackMemoryUsage(estimatedSize);

      let processedUri = imageUri;
      let processedSize = estimatedSize;

      // Compress image if enabled and beneficial
      if (
        enableCompression &&
        ImageCache.shouldCompress(estimatedSize, priority)
      ) {
        try {
          const compressed = await compressImage(imageUri, {
            maxWidth: 1024,
            maxHeight: 1024,
            maxSizeKB: 1024,
            ...compressionOptions,
          });

          if (compressed.size < estimatedSize * 0.8) {
            // Only use if 20%+ reduction
            processedUri = compressed.uri;
            processedSize = compressed.size;

            if (appSettings.debugMode) {
              console.log('🗜️ Image compressed:', {
                original: `${(estimatedSize / 1024).toFixed(2)}KB`,
                compressed: `${(processedSize / 1024).toFixed(2)}KB`,
                reduction: `${((1 - processedSize / estimatedSize) * 100).toFixed(1)}%`,
              });
            }
          }
        } catch (error) {
          console.warn('⚠️ Image compression failed, using original:', error);
        }
      }

      // Cache the processed image
      const cacheEntry: CachedImage = {
        uri: imageUri,
        compressedUri: processedUri !== imageUri ? processedUri : undefined,
        size: estimatedSize,
        compressedSize: processedUri !== imageUri ? processedSize : undefined,
        timestamp: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now(),
      };

      ImageCache.cache.set(cacheKey, cacheEntry);

      // Ensure cache doesn't exceed limits
      await ImageCache.enforceCacheLimits();

      if (appSettings.debugMode) {
        console.log('💾 Image cached:', {
          cacheKey,
          size: processedSize,
          cacheSize: ImageCache.getCacheSize(),
          entries: ImageCache.cache.size,
        });
      }

      return {
        uri: processedUri,
        size: processedSize,
        fromCache: false,
      };
    } catch (error) {
      console.error('❌ Image cache error:', error);
      // Release any tracked memory on error
      ImageMemoryManager.releaseMemory(
        await ImageCache.estimateImageSize(imageUri),
      );

      // Return original image as fallback
      return {
        uri: imageUri,
        size: await ImageCache.estimateImageSize(imageUri),
        fromCache: false,
      };
    }
  }

  /**
   * Preload images for better performance
   */
  static async preloadImages(
    imageUris: string[],
    options: ImageCacheOptions = {},
  ): Promise<void> {
    const preloadPromises = imageUris.map(async (uri) => {
      try {
        await ImageCache.getCachedImage(uri, { ...options, priority: 'low' });
      } catch (error) {
        console.warn('⚠️ Failed to preload image:', uri, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Clear specific image from cache
   */
  static clearImage(cacheKey: string): void {
    const cached = ImageCache.cache.get(cacheKey);
    if (cached) {
      // Release memory tracking
      ImageMemoryManager.releaseMemory(cached.compressedSize || cached.size);
      ImageCache.cache.delete(cacheKey);

      if (appSettings.debugMode) {
        console.log('🗑️ Image cleared from cache:', cacheKey);
      }
    }
  }

  /**
   * Clear all cached images
   */
  static clearAll(): void {
    // Release all tracked memory
    for (const cached of ImageCache.cache.values()) {
      ImageMemoryManager.releaseMemory(cached.compressedSize || cached.size);
    }

    ImageCache.cache.clear();

    if (appSettings.debugMode) {
      console.log('🗑️ All images cleared from cache');
    }
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    size: number;
    entries: number;
    memoryUsage: number;
    hitRate: number;
  } {
    const totalAccess = Array.from(ImageCache.cache.values()).reduce(
      (sum, cached) => sum + cached.accessCount,
      0,
    );
    const cacheHits = Array.from(ImageCache.cache.values()).reduce(
      (sum, cached) => sum + (cached.accessCount - 1),
      0,
    );

    return {
      size: ImageCache.getCacheSize(),
      entries: ImageCache.cache.size,
      memoryUsage: ImageMemoryManager.getMemoryUsage().current,
      hitRate: totalAccess > 0 ? (cacheHits / totalAccess) * 100 : 0,
    };
  }

  /**
   * Force cleanup to free memory
   */
  static async cleanup(requiredBytes = 0): Promise<void> {
    const memoryUsage = ImageMemoryManager.getMemoryUsage();
    const cacheSize = ImageCache.getCacheSize();

    if (appSettings.debugMode) {
      console.log('🧹 Starting cache cleanup:', {
        memoryUsage: `${(memoryUsage.current / 1024 / 1024).toFixed(2)}MB`,
        cacheSize: `${(cacheSize / 1024 / 1024).toFixed(2)}MB`,
        requiredBytes: `${(requiredBytes / 1024 / 1024).toFixed(2)}MB`,
      });
    }

    // Remove expired entries first
    ImageCache.removeExpiredEntries();

    // If still need more space, remove least recently used entries
    if (
      cacheSize + requiredBytes > ImageCache.MAX_CACHE_SIZE ||
      memoryUsage.percentage > 80
    ) {
      ImageCache.removeLeastRecentlyUsed(requiredBytes);
    }
  }

  // Private helper methods

  private static isCacheValid(cached: CachedImage): boolean {
    const now = Date.now();
    return now - cached.timestamp < ImageCache.CACHE_EXPIRY_MS;
  }

  private static async estimateImageSize(imageUri: string): Promise<number> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      return blob.size;
    } catch {
      // Fallback estimation based on URI
      return 1024 * 1024; // 1MB default estimate
    }
  }

  private static shouldCompress(
    size: number,
    priority: 'low' | 'normal' | 'high',
  ): boolean {
    const sizeThresholds = {
      low: 2 * 1024 * 1024, // 2MB
      normal: 1 * 1024 * 1024, // 1MB
      high: 512 * 1024, // 512KB
    };

    return size > sizeThresholds[priority];
  }

  private static getCacheSize(): number {
    return Array.from(ImageCache.cache.values()).reduce(
      (total, cached) => total + (cached.compressedSize || cached.size),
      0,
    );
  }

  private static async enforceCacheLimits(): Promise<void> {
    // Remove entries if cache is too large
    while (
      ImageCache.cache.size > ImageCache.MAX_CACHE_ENTRIES ||
      ImageCache.getCacheSize() > ImageCache.MAX_CACHE_SIZE
    ) {
      ImageCache.removeLeastRecentlyUsed();
    }
  }

  private static removeExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, cached] of ImageCache.cache.entries()) {
      if (now - cached.timestamp > ImageCache.CACHE_EXPIRY_MS) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      ImageCache.clearImage(key);
    }

    if (appSettings.debugMode && expiredKeys.length > 0) {
      console.log('🗑️ Removed expired cache entries:', expiredKeys.length);
    }
  }

  private static removeLeastRecentlyUsed(requiredBytes = 0): void {
    // Sort by last accessed time (oldest first)
    const sortedEntries = Array.from(ImageCache.cache.entries()).sort(
      ([, a], [, b]) => a.lastAccessed - b.lastAccessed,
    );

    let freedBytes = 0;
    const removedKeys: string[] = [];

    for (const [key, cached] of sortedEntries) {
      if (
        freedBytes >= requiredBytes &&
        ImageCache.getCacheSize() <= ImageCache.MAX_CACHE_SIZE * 0.8
      ) {
        break;
      }

      freedBytes += cached.compressedSize || cached.size;
      removedKeys.push(key);
      ImageCache.clearImage(key);
    }

    if (appSettings.debugMode && removedKeys.length > 0) {
      console.log('🗑️ Removed LRU cache entries:', {
        count: removedKeys.length,
        freedMB: (freedBytes / 1024 / 1024).toFixed(2),
      });
    }
  }
}
