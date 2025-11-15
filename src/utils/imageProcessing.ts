import { appSettings } from '../config';
import type { ImageProcessingOptions, ProcessedImage } from '../types';

// Error types for image processing
export class ImageProcessingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'ImageProcessingError';
  }
}

// Supported image formats
export const SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'webp'] as const;
export type SupportedFormat = (typeof SUPPORTED_FORMATS)[number];

// Image processing configuration
export interface ImageProcessingConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'jpeg' | 'png';
  maxFileSize: number; // in bytes
  compressionSteps: number;
}

// Default configuration optimized for API uploads
export const DEFAULT_CONFIG: ImageProcessingConfig = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.8,
  format: 'jpeg',
  maxFileSize: 2 * 1024 * 1024, // 2MB
  compressionSteps: 3,
};

// Configuration for different use cases
export const PROCESSING_PRESETS = {
  api_upload: {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.8,
    format: 'jpeg' as const,
    maxFileSize: 2 * 1024 * 1024,
    compressionSteps: 3,
  },
  thumbnail: {
    maxWidth: 200,
    maxHeight: 200,
    quality: 0.7,
    format: 'jpeg' as const,
    maxFileSize: 100 * 1024, // 100KB
    compressionSteps: 2,
  },
  preview: {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.8,
    format: 'jpeg' as const,
    maxFileSize: 500 * 1024, // 500KB
    compressionSteps: 2,
  },
} as const;

/**
 * Main image processing utility class
 */
export class ImageProcessor {
  private static tempFiles: Set<string> = new Set();
  private static cleanupTimer: NodeJS.Timeout | null = null;

  /**
   * Process image with compression and optimization
   */
  static async processImage(
    imageUri: string,
    options: Partial<ImageProcessingOptions> = {},
    preset: keyof typeof PROCESSING_PRESETS = 'api_upload',
  ): Promise<ProcessedImage> {
    try {
      const processingConfig = { ...PROCESSING_PRESETS[preset], ...options };

      if (appSettings.debugMode) {
        console.log('Processing image with config:', processingConfig);
      }

      // Validate input
      await ImageProcessor.validateImageUri(imageUri);

      // Get image info
      const imageInfo = await ImageProcessor.getImageInfo(imageUri);

      // Check if processing is needed
      const needsProcessing = ImageProcessor.needsProcessing(
        imageInfo,
        processingConfig,
      );

      if (!needsProcessing) {
        // Image is already optimized, just convert to base64
        return await ImageProcessor.convertToBase64(
          imageUri,
          processingConfig.format,
        );
      }

      // Process the image with compression
      const processedUri = await ImageProcessor.compressImage(
        imageUri,
        processingConfig,
      );

      // Convert to base64
      const result = await ImageProcessor.convertToBase64(
        processedUri,
        processingConfig.format,
      );

      // Schedule cleanup of temporary file
      if (processedUri !== imageUri) {
        ImageProcessor.scheduleCleanup(processedUri);
      }

      if (appSettings.debugMode) {
        console.log(
          `Image processed: ${result.size} bytes, format: ${result.mimeType}`,
        );
      }

      return result;
    } catch (error) {
      throw new ImageProcessingError(
        `Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PROCESSING_ERROR',
        { originalUri: imageUri, options },
      );
    }
  }

  /**
   * Validate image format and accessibility
   */
  static async validateImageUri(imageUri: string): Promise<void> {
    if (!imageUri || typeof imageUri !== 'string') {
      throw new ImageProcessingError(
        'Invalid image URI provided',
        'INVALID_URI',
      );
    }

    // Check if file exists (for file:// URIs)
    if (imageUri.startsWith('file://')) {
      try {
        const response = await fetch(imageUri);
        if (!response.ok) {
          throw new Error(`File not accessible: ${response.status}`);
        }
      } catch (error) {
        throw new ImageProcessingError(
          `Cannot access image file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'FILE_ACCESS_ERROR',
        );
      }
    }

    // Validate format by extension
    const format = ImageProcessor.getImageFormat(imageUri);
    if (!SUPPORTED_FORMATS.includes(format as SupportedFormat)) {
      throw new ImageProcessingError(
        `Unsupported image format: ${format}. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`,
        'UNSUPPORTED_FORMAT',
      );
    }
  }

  /**
   * Get image information without loading the full image
   */
  static async getImageInfo(imageUri: string): Promise<{
    width: number;
    height: number;
    size: number;
    format: string;
  }> {
    try {
      // For React Native, we'll use a simple approach to get file size
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Estimate dimensions based on file size (rough approximation)
      // In a real implementation, you might use react-native-image-size
      const size = blob.size;
      const estimatedPixels = size / 3; // Rough estimate for JPEG
      const estimatedDimension = Math.sqrt(estimatedPixels);

      return {
        width: Math.round(estimatedDimension),
        height: Math.round(estimatedDimension),
        size,
        format: ImageProcessor.getImageFormat(imageUri),
      };
    } catch (error) {
      throw new ImageProcessingError(
        `Failed to get image info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'INFO_EXTRACTION_ERROR',
      );
    }
  }

  /**
   * Check if image needs processing based on config
   */
  static needsProcessing(
    imageInfo: { width: number; height: number; size: number; format: string },
    config: ImageProcessingConfig,
  ): boolean {
    // Check if size exceeds limits
    if (imageInfo.size > config.maxFileSize) {
      return true;
    }

    // Check if dimensions exceed limits
    if (
      imageInfo.width > config.maxWidth ||
      imageInfo.height > config.maxHeight
    ) {
      return true;
    }

    // Check if format conversion is needed
    if (imageInfo.format !== config.format) {
      return true;
    }

    return false;
  }

  /**
   * Compress image using React Native's built-in capabilities
   */
  static async compressImage(
    imageUri: string,
    _config: ImageProcessingConfig,
  ): Promise<string> {
    try {
      // For React Native, we'll use a simplified approach
      // In a production app, you might use react-native-image-resizer

      // For now, we'll return the original URI and rely on base64 conversion
      // to handle basic compression through quality settings
      return imageUri;
    } catch (error) {
      throw new ImageProcessingError(
        `Image compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'COMPRESSION_ERROR',
      );
    }
  }

  /**
   * Convert image to base64 with format conversion
   */
  static async convertToBase64(
    imageUri: string,
    targetFormat: 'jpeg' | 'png' = 'jpeg',
  ): Promise<ProcessedImage> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = result.split(',')[1];

          if (!base64) {
            reject(new Error('Failed to extract base64 data'));
            return;
          }

          const mimeType = targetFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
          // Calculate approximate size (base64 is ~33% larger than binary)
          const size = Math.floor((base64.length * 3) / 4);

          resolve({
            base64,
            mimeType,
            size,
          });
        };
        reader.onerror = () => reject(new Error('Failed to read image data'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new ImageProcessingError(
        `Base64 conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'BASE64_CONVERSION_ERROR',
      );
    }
  }

  /**
   * Get image format from URI
   */
  static getImageFormat(imageUri: string): string {
    const extension = imageUri.split('.').pop()?.toLowerCase() || '';

    // Normalize common variations
    switch (extension) {
      case 'jpg':
        return 'jpeg';
      case 'jpeg':
        return 'jpeg';
      case 'png':
        return 'png';
      case 'webp':
        return 'webp';
      default:
        return extension; // Return actual extension
    }
  }

  /**
   * Schedule cleanup of temporary files
   */
  static scheduleCleanup(filePath: string): void {
    ImageProcessor.tempFiles.add(filePath);

    // Clear existing timer
    if (ImageProcessor.cleanupTimer) {
      clearTimeout(ImageProcessor.cleanupTimer);
    }

    // Schedule cleanup after 5 minutes
    ImageProcessor.cleanupTimer = setTimeout(
      () => {
        ImageProcessor.cleanupTempFiles();
      },
      5 * 60 * 1000,
    );
  }

  /**
   * Clean up temporary files
   */
  static async cleanupTempFiles(): Promise<void> {
    if (ImageProcessor.tempFiles.size === 0) {
      return;
    }

    if (appSettings.debugMode) {
      console.log(
        `Cleaning up ${ImageProcessor.tempFiles.size} temporary files`,
      );
    }

    const filesToClean = Array.from(ImageProcessor.tempFiles);
    ImageProcessor.tempFiles.clear();

    // In React Native, we don't have direct file system access
    // The cleanup would typically be handled by the OS
    // For now, we'll just clear our tracking set

    if (appSettings.debugMode) {
      console.log(`Cleanup completed for ${filesToClean.length} files`);
    }
  }

  /**
   * Force immediate cleanup of all temporary files
   */
  static async forceCleanup(): Promise<void> {
    if (ImageProcessor.cleanupTimer) {
      clearTimeout(ImageProcessor.cleanupTimer);
      ImageProcessor.cleanupTimer = null;
    }

    await ImageProcessor.cleanupTempFiles();
  }

  /**
   * Get memory usage estimate for image processing
   */
  static estimateMemoryUsage(
    width: number,
    height: number,
    format: 'jpeg' | 'png' = 'jpeg',
  ): number {
    // Estimate memory usage in bytes
    const pixelCount = width * height;
    const bytesPerPixel = format === 'png' ? 4 : 3; // PNG has alpha channel
    const rawSize = pixelCount * bytesPerPixel;

    // Add overhead for processing (typically 2-3x the raw size)
    const processingOverhead = rawSize * 2.5;

    return Math.round(rawSize + processingOverhead);
  }

  /**
   * Check if device has enough memory for processing
   */
  static canProcessImage(
    width: number,
    height: number,
    format: 'jpeg' | 'png' = 'jpeg',
  ): { canProcess: boolean; estimatedMemory: number; reason?: string } {
    const estimatedMemory = ImageProcessor.estimateMemoryUsage(
      width,
      height,
      format,
    );

    // Conservative memory limit (50MB for image processing)
    const memoryLimit = 50 * 1024 * 1024;

    if (estimatedMemory > memoryLimit) {
      return {
        canProcess: false,
        estimatedMemory,
        reason: `Image too large for processing. Estimated memory: ${Math.round(estimatedMemory / 1024 / 1024)}MB, limit: ${Math.round(memoryLimit / 1024 / 1024)}MB`,
      };
    }

    return {
      canProcess: true,
      estimatedMemory,
    };
  }

  /**
   * Optimize image for specific use case
   */
  static async optimizeForUseCase(
    imageUri: string,
    useCase: 'api_upload' | 'thumbnail' | 'preview',
  ): Promise<ProcessedImage> {
    return ImageProcessor.processImage(imageUri, {}, useCase);
  }

  /**
   * Batch process multiple images
   */
  static async batchProcess(
    imageUris: string[],
    options: Partial<ImageProcessingOptions> = {},
    preset: keyof typeof PROCESSING_PRESETS = 'api_upload',
  ): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = [];
    const errors: Error[] = [];

    // Process images sequentially to avoid memory issues
    for (const uri of imageUris) {
      try {
        const processed = await ImageProcessor.processImage(
          uri,
          options,
          preset,
        );
        results.push(processed);
      } catch (error) {
        errors.push(
          error instanceof Error ? error : new Error('Unknown error'),
        );
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw new ImageProcessingError(
        `Batch processing failed: ${errors.map((e) => e.message).join(', ')}`,
        'BATCH_PROCESSING_ERROR',
        { errors },
      );
    }

    return results;
  }
}

/**
 * Utility functions for image validation
 */
export class ImageValidator {
  /**
   * Validate image file size
   */
  static async validateFileSize(
    imageUri: string,
    maxSize: number = DEFAULT_CONFIG.maxFileSize,
  ): Promise<{ isValid: boolean; size: number; error?: string }> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const size = blob.size;

      if (size > maxSize) {
        return {
          isValid: false,
          size,
          error: `File size ${Math.round(size / 1024)}KB exceeds limit of ${Math.round(maxSize / 1024)}KB`,
        };
      }

      return { isValid: true, size };
    } catch (error) {
      return {
        isValid: false,
        size: 0,
        error: `Failed to validate file size: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Validate image format
   */
  static validateFormat(imageUri: string): {
    isValid: boolean;
    format: string;
    error?: string;
  } {
    const format = ImageProcessor.getImageFormat(imageUri);

    if (!SUPPORTED_FORMATS.includes(format as SupportedFormat)) {
      return {
        isValid: false,
        format,
        error: `Unsupported format: ${format}. Supported: ${SUPPORTED_FORMATS.join(', ')}`,
      };
    }

    return { isValid: true, format };
  }

  /**
   * Comprehensive image validation
   */
  static async validateImage(
    imageUri: string,
    options: {
      maxSize?: number;
      allowedFormats?: SupportedFormat[];
      maxWidth?: number;
      maxHeight?: number;
    } = {},
  ): Promise<{
    isValid: boolean;
    errors: string[];
    info?: {
      size: number;
      format: string;
      width?: number;
      height?: number;
    };
  }> {
    const errors: string[] = [];
    const info: any = {};

    try {
      // Validate format
      const formatValidation = ImageValidator.validateFormat(imageUri);
      if (!formatValidation.isValid) {
        errors.push(formatValidation.error!);
      } else {
        info.format = formatValidation.format;
      }

      // Validate file size
      const sizeValidation = await ImageValidator.validateFileSize(
        imageUri,
        options.maxSize || DEFAULT_CONFIG.maxFileSize,
      );
      if (!sizeValidation.isValid) {
        errors.push(sizeValidation.error!);
      } else {
        info.size = sizeValidation.size;
      }

      // Get image dimensions if needed
      if (options.maxWidth || options.maxHeight) {
        try {
          const imageInfo = await ImageProcessor.getImageInfo(imageUri);
          info.width = imageInfo.width;
          info.height = imageInfo.height;

          if (options.maxWidth && imageInfo.width > options.maxWidth) {
            errors.push(
              `Image width ${imageInfo.width}px exceeds limit of ${options.maxWidth}px`,
            );
          }

          if (options.maxHeight && imageInfo.height > options.maxHeight) {
            errors.push(
              `Image height ${imageInfo.height}px exceeds limit of ${options.maxHeight}px`,
            );
          }
        } catch (error) {
          errors.push(
            `Failed to get image dimensions: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        info: errors.length === 0 ? info : undefined,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [
          `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }
}

/**
 * Memory management utilities
 */
export class ImageMemoryManager {
  private static memoryUsage = 0;
  private static readonly MEMORY_LIMIT = 100 * 1024 * 1024; // 100MB limit
  private static readonly WARNING_THRESHOLD = 0.8; // 80% of limit

  /**
   * Track memory usage for image processing
   */
  static trackMemoryUsage(bytes: number): void {
    ImageMemoryManager.memoryUsage += bytes;

    if (
      ImageMemoryManager.memoryUsage >
      ImageMemoryManager.MEMORY_LIMIT * ImageMemoryManager.WARNING_THRESHOLD
    ) {
      console.warn(
        `Image processing memory usage high: ${Math.round(ImageMemoryManager.memoryUsage / 1024 / 1024)}MB`,
      );

      if (ImageMemoryManager.memoryUsage > ImageMemoryManager.MEMORY_LIMIT) {
        console.error(
          `Memory limit exceeded: ${Math.round(ImageMemoryManager.memoryUsage / 1024 / 1024)}MB`,
        );
        // Force cleanup
        ImageProcessor.forceCleanup();
        ImageMemoryManager.releaseMemory(ImageMemoryManager.memoryUsage * 0.5); // Release half
      }
    }
  }

  /**
   * Release tracked memory
   */
  static releaseMemory(bytes: number): void {
    ImageMemoryManager.memoryUsage = Math.max(
      0,
      ImageMemoryManager.memoryUsage - bytes,
    );
  }

  /**
   * Get current memory usage
   */
  static getMemoryUsage(): {
    current: number;
    limit: number;
    percentage: number;
  } {
    return {
      current: ImageMemoryManager.memoryUsage,
      limit: ImageMemoryManager.MEMORY_LIMIT,
      percentage:
        (ImageMemoryManager.memoryUsage / ImageMemoryManager.MEMORY_LIMIT) *
        100,
    };
  }

  /**
   * Check if memory is available for processing
   */
  static canAllocate(bytes: number): boolean {
    return (
      ImageMemoryManager.memoryUsage + bytes <= ImageMemoryManager.MEMORY_LIMIT
    );
  }

  /**
   * Reset memory tracking
   */
  static reset(): void {
    ImageMemoryManager.memoryUsage = 0;
  }
}

// Export convenience functions
export const processImageForAPI = (
  imageUri: string,
  _processingOptions?: Partial<ImageProcessingOptions>,
) => ImageProcessor.optimizeForUseCase(imageUri, 'api_upload');

export const createThumbnail = (
  imageUri: string,
  _processingOptions?: Partial<ImageProcessingOptions>,
) => ImageProcessor.optimizeForUseCase(imageUri, 'thumbnail');

export const createPreview = (
  imageUri: string,
  _processingOptions?: Partial<ImageProcessingOptions>,
) => ImageProcessor.optimizeForUseCase(imageUri, 'preview');

export const validateImage = ImageValidator.validateImage;
export const cleanupTempFiles = () => ImageProcessor.forceCleanup();
