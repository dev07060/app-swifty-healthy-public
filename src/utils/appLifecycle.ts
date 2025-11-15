import { AppState, type AppStateStatus } from 'react-native';
import { appSettings } from '../config';
import { ImageCache } from './imageCache';
import { cleanupTempFiles } from './imageProcessing';
import { ImageMemoryManager } from './imageProcessing';

/**
 * App lifecycle management for image processing cleanup
 */
export class AppLifecycleManager {
  private static isInitialized = false;
  private static appStateSubscription: any = null;
  private static cleanupTimer: NodeJS.Timeout | null = null;

  /**
   * Initialize app lifecycle management
   */
  static initialize(): void {
    if (AppLifecycleManager.isInitialized) {
      return;
    }

    AppLifecycleManager.appStateSubscription = AppState.addEventListener(
      'change',
      AppLifecycleManager.handleAppStateChange,
    );

    AppLifecycleManager.isInitialized = true;

    if (appSettings.debugMode) {
      console.log('App lifecycle manager initialized');
    }
  }

  /**
   * Cleanup app lifecycle management
   */
  static cleanup(): void {
    if (AppLifecycleManager.appStateSubscription) {
      AppLifecycleManager.appStateSubscription.remove();
      AppLifecycleManager.appStateSubscription = null;
    }

    if (AppLifecycleManager.cleanupTimer) {
      clearTimeout(AppLifecycleManager.cleanupTimer);
      AppLifecycleManager.cleanupTimer = null;
    }

    AppLifecycleManager.isInitialized = false;

    if (appSettings.debugMode) {
      console.log('App lifecycle manager cleaned up');
    }
  }

  /**
   * Handle app state changes
   */
  private static handleAppStateChange = (
    nextAppState: AppStateStatus,
  ): void => {
    if (appSettings.debugMode) {
      console.log('App state changed to:', nextAppState);
    }

    switch (nextAppState) {
      case 'background':
        this.handleAppBackground();
        break;
      case 'inactive':
        this.handleAppInactive();
        break;
      case 'active':
        this.handleAppActive();
        break;
    }
  };

  /**
   * Handle app going to background
   */
  private static handleAppBackground(): void {
    if (appSettings.debugMode) {
      console.log('App backgrounded - scheduling cleanup');
    }

    // Schedule cleanup after 30 seconds in background
    AppLifecycleManager.cleanupTimer = setTimeout(async () => {
      try {
        await AppLifecycleManager.performCleanup();
      } catch (error) {
        console.error('Background cleanup failed:', error);
      }
    }, 30 * 1000);
  }

  /**
   * Handle app becoming inactive
   */
  private static handleAppInactive(): void {
    // App is transitioning between states
    // Don't perform cleanup yet
  }

  /**
   * Handle app becoming active
   */
  private static handleAppActive(): void {
    if (appSettings.debugMode) {
      console.log('App activated - canceling scheduled cleanup');
    }

    // Cancel any scheduled cleanup
    if (AppLifecycleManager.cleanupTimer) {
      clearTimeout(AppLifecycleManager.cleanupTimer);
      AppLifecycleManager.cleanupTimer = null;
    }
  }

  /**
   * Perform comprehensive cleanup
   */
  private static async performCleanup(): Promise<void> {
    if (appSettings.debugMode) {
      console.log('Performing app lifecycle cleanup');
    }

    try {
      // Clean up temporary image files
      await cleanupTempFiles();

      // Reset memory tracking and clear cache
      ImageMemoryManager.reset();
      ImageCache.clearAll();

      if (appSettings.debugMode) {
        console.log('App lifecycle cleanup completed');
      }
    } catch (error) {
      console.error('App lifecycle cleanup failed:', error);
    }
  }

  /**
   * Force immediate cleanup (can be called manually)
   */
  static async forceCleanup(): Promise<void> {
    await AppLifecycleManager.performCleanup();
  }

  /**
   * Get cleanup status
   */
  static getStatus(): {
    isInitialized: boolean;
    hasScheduledCleanup: boolean;
  } {
    return {
      isInitialized: AppLifecycleManager.isInitialized,
      hasScheduledCleanup: AppLifecycleManager.cleanupTimer !== null,
    };
  }
}

/**
 * Hook for app lifecycle management
 */
export const useAppLifecycle = () => {
  const initialize = () => AppLifecycleManager.initialize();
  const cleanup = () => AppLifecycleManager.cleanup();
  const forceCleanup = () => AppLifecycleManager.forceCleanup();
  const getStatus = () => AppLifecycleManager.getStatus();

  return {
    initialize,
    cleanup,
    forceCleanup,
    getStatus,
  };
};

/**
 * Memory pressure handler
 */
export class MemoryPressureHandler {
  private static isListening = false;

  /**
   * Start listening for memory pressure events
   * Note: React Native doesn't have built-in memory pressure events
   * This is a placeholder for future implementation
   */
  static startListening(): void {
    if (MemoryPressureHandler.isListening) {
      return;
    }

    // In a real implementation, you might use:
    // - Native modules to listen for memory warnings
    // - Periodic memory usage checks
    // - Integration with crash reporting tools

    MemoryPressureHandler.isListening = true;

    if (appSettings.debugMode) {
      console.log('Memory pressure handler started');
    }
  }

  /**
   * Stop listening for memory pressure events
   */
  static stopListening(): void {
    MemoryPressureHandler.isListening = false;

    if (appSettings.debugMode) {
      console.log('Memory pressure handler stopped');
    }
  }

  /**
   * Handle memory pressure event
   */
  private static async handleMemoryPressure(): Promise<void> {
    if (appSettings.debugMode) {
      console.log('Memory pressure detected - performing emergency cleanup');
    }

    try {
      // Perform aggressive cleanup
      await cleanupTempFiles();
      ImageCache.clearAll();
      ImageMemoryManager.reset();

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      if (appSettings.debugMode) {
        console.log('Emergency cleanup completed');
      }
    } catch (error) {
      console.error('Emergency cleanup failed:', error);
    }
  }

  /**
   * Check memory usage and trigger cleanup if needed
   */
  static async checkMemoryUsage(): Promise<void> {
    const memoryUsage = ImageMemoryManager.getMemoryUsage();

    if (memoryUsage.percentage > 90) {
      // Trigger cache cleanup first
      await ImageCache.cleanup(memoryUsage.current * 0.3); // Try to free 30% of current usage
      await MemoryPressureHandler.handleMemoryPressure();
    }
  }
}

// Auto-initialize when module is imported
if (typeof global !== 'undefined' && global.navigator) {
  // Only initialize in React Native environment
  AppLifecycleManager.initialize();
  MemoryPressureHandler.startListening();
}
