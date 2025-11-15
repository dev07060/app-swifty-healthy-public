import { useCallback, useEffect, useState } from 'react';
import { appSettings } from '../config';
import { ImageCache } from '../utils/imageCache';
import { ImageMemoryManager } from '../utils/imageProcessing';

export interface MemoryStats {
  current: number;
  limit: number;
  percentage: number;
  cacheStats: {
    size: number;
    entries: number;
    hitRate: number;
  };
}

export interface MemoryMonitorOptions {
  updateInterval?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  autoCleanup?: boolean;
}

/**
 * Hook for monitoring image memory usage and cache performance
 */
export function useImageMemoryMonitor(options: MemoryMonitorOptions = {}) {
  const {
    updateInterval = 2000,
    warningThreshold = 70,
    criticalThreshold = 85,
    autoCleanup = true,
  } = options;

  const [memoryStats, setMemoryStats] = useState<MemoryStats>(() => ({
    current: 0,
    limit: 0,
    percentage: 0,
    cacheStats: {
      size: 0,
      entries: 0,
      hitRate: 0,
    },
  }));

  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  // Update memory statistics
  const updateStats = useCallback(() => {
    const memoryUsage = ImageMemoryManager.getMemoryUsage();
    const cacheStats = ImageCache.getCacheStats();

    const stats: MemoryStats = {
      current: memoryUsage.current,
      limit: memoryUsage.limit,
      percentage: memoryUsage.percentage,
      cacheStats: {
        size: cacheStats.size,
        entries: cacheStats.entries,
        hitRate: cacheStats.hitRate,
      },
    };

    setMemoryStats(stats);

    // Update warning states
    const newIsWarning = stats.percentage >= warningThreshold;
    const newIsCritical = stats.percentage >= criticalThreshold;

    setIsWarning(newIsWarning);
    setIsCritical(newIsCritical);

    // Auto cleanup if critical and enabled
    if (newIsCritical && autoCleanup) {
      performCleanup();
    }

    // Debug logging
    if (appSettings.debugMode && (newIsWarning || newIsCritical)) {
      console.log('📊 Memory usage:', {
        percentage: `${stats.percentage.toFixed(1)}%`,
        current: `${(stats.current / 1024 / 1024).toFixed(2)}MB`,
        cache: `${(stats.cacheStats.size / 1024 / 1024).toFixed(2)}MB`,
        hitRate: `${stats.cacheStats.hitRate.toFixed(1)}%`,
        status: newIsCritical ? 'CRITICAL' : newIsWarning ? 'WARNING' : 'OK',
      });
    }
  }, [warningThreshold, criticalThreshold, autoCleanup]);

  // Periodic memory monitoring
  useEffect(() => {
    // Initial update
    updateStats();

    // Set up interval
    const interval = setInterval(updateStats, updateInterval);

    return () => clearInterval(interval);
  }, [updateStats, updateInterval]);

  // Manual cleanup function
  const performCleanup = useCallback(async () => {
    try {
      if (appSettings.debugMode) {
        console.log('🧹 Performing memory cleanup...');
      }

      await ImageCache.cleanup();

      // Update stats after cleanup
      setTimeout(updateStats, 100);

      if (appSettings.debugMode) {
        console.log('✅ Memory cleanup completed');
      }
    } catch (error) {
      console.error('❌ Memory cleanup failed:', error);
    }
  }, [updateStats]);

  // Force aggressive cleanup
  const forceCleanup = useCallback(async () => {
    try {
      if (appSettings.debugMode) {
        console.log('🧹 Performing aggressive cleanup...');
      }

      // Clear all cache
      ImageCache.clearAll();

      // Reset memory manager
      ImageMemoryManager.reset();

      // Update stats
      setTimeout(updateStats, 100);

      if (appSettings.debugMode) {
        console.log('✅ Aggressive cleanup completed');
      }
    } catch (error) {
      console.error('❌ Aggressive cleanup failed:', error);
    }
  }, [updateStats]);

  // Get formatted memory info for display
  const getFormattedStats = useCallback(() => {
    return {
      memory: {
        current: `${(memoryStats.current / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memoryStats.limit / 1024 / 1024).toFixed(2)}MB`,
        percentage: `${memoryStats.percentage.toFixed(1)}%`,
      },
      cache: {
        size: `${(memoryStats.cacheStats.size / 1024 / 1024).toFixed(2)}MB`,
        entries: memoryStats.cacheStats.entries.toString(),
        hitRate: `${memoryStats.cacheStats.hitRate.toFixed(1)}%`,
      },
    };
  }, [memoryStats]);

  // Check if memory is available for allocation
  const canAllocate = useCallback((bytes: number) => {
    return ImageMemoryManager.canAllocate(bytes);
  }, []);

  // Preload images with memory check
  const preloadImages = useCallback(
    async (imageUris: string[]) => {
      if (isCritical) {
        console.warn('⚠️ Skipping image preload due to critical memory usage');
        return;
      }

      try {
        await ImageCache.preloadImages(imageUris, { priority: 'low' });
        updateStats();
      } catch (error) {
        console.error('❌ Image preload failed:', error);
      }
    },
    [isCritical, updateStats],
  );

  return {
    // Current state
    memoryStats,
    isWarning,
    isCritical,

    // Actions
    performCleanup,
    forceCleanup,
    updateStats,
    canAllocate,
    preloadImages,

    // Utilities
    getFormattedStats,
  };
}

/**
 * Lightweight hook for basic memory monitoring
 */
export function useMemoryUsage() {
  const [memoryUsage, setMemoryUsage] = useState(
    ImageMemoryManager.getMemoryUsage(),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setMemoryUsage(ImageMemoryManager.getMemoryUsage());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return memoryUsage;
}
