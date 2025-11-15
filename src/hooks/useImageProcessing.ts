import { useCallback, useEffect, useState } from 'react';
import type { ImageProcessingOptions, ProcessedImage } from '../types';
import { type AppError, ErrorHandlingUtils } from '../utils/errorHandling';
import { ImageCache } from '../utils/imageCache';
import {
  ImageMemoryManager,
  ImageProcessor,
  ImageValidator,
  PROCESSING_PRESETS,
  cleanupTempFiles,
} from '../utils/imageProcessing';

interface ImageProcessingState {
  processedImage: ProcessedImage | null;
  isProcessing: boolean;
  error: AppError | null;
  progress: number;
  memoryUsage: {
    current: number;
    limit: number;
    percentage: number;
  };
}

interface ImageProcessingHookOptions {
  onSuccess?: (processedImage: ProcessedImage) => void;
  onError?: (error: AppError) => void;
  onProgress?: (progress: number) => void;
  preset?: keyof typeof PROCESSING_PRESETS;
  autoCleanup?: boolean;
}

/**
 * Hook for image processing with optimization and memory management
 */
export const useImageProcessing = (
  options: ImageProcessingHookOptions = {},
) => {
  const [state, setState] = useState<ImageProcessingState>({
    processedImage: null,
    isProcessing: false,
    error: null,
    progress: 0,
    memoryUsage: ImageMemoryManager.getMemoryUsage(),
  });

  // Update memory usage periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        memoryUsage: ImageMemoryManager.getMemoryUsage(),
      }));
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Auto cleanup on unmount
  useEffect(() => {
    if (options.autoCleanup !== false) {
      return () => {
        cleanupTempFiles();
      };
    }
    return undefined;
  }, [options.autoCleanup]);

  const processImage = useCallback(
    async (
      imageUri: string,
      processingOptions?: Partial<ImageProcessingOptions>,
    ): Promise<ProcessedImage | undefined> => {
      setState((prev) => ({
        ...prev,
        isProcessing: true,
        error: null,
        progress: 0,
      }));

      try {
        // Validate image first
        options.onProgress?.(10);
        setState((prev) => ({ ...prev, progress: 10 }));

        const validation = await ImageValidator.validateImage(imageUri, {
          maxSize:
            PROCESSING_PRESETS[options.preset || 'api_upload'].maxFileSize,
        });

        if (!validation.isValid) {
          throw new Error(
            `Image validation failed: ${validation.errors.join(', ')}`,
          );
        }

        options.onProgress?.(30);
        setState((prev) => ({ ...prev, progress: 30 }));

        // Check memory availability
        if (validation.info?.width && validation.info?.height) {
          const memoryCheck = ImageProcessor.canProcessImage(
            validation.info.width,
            validation.info.height,
          );

          if (!memoryCheck.canProcess) {
            throw new Error(
              memoryCheck.reason || 'Insufficient memory for image processing',
            );
          }
        }

        options.onProgress?.(50);
        setState((prev) => ({ ...prev, progress: 50 }));

        // Process the image
        const processedImage = await ImageProcessor.processImage(
          imageUri,
          processingOptions,
          options.preset || 'api_upload',
        );

        options.onProgress?.(90);
        setState((prev) => ({ ...prev, progress: 90 }));

        // Track memory usage
        ImageMemoryManager.trackMemoryUsage(processedImage.size);

        options.onProgress?.(100);
        setState({
          processedImage,
          isProcessing: false,
          error: null,
          progress: 100,
          memoryUsage: ImageMemoryManager.getMemoryUsage(),
        });

        // Reset progress after a brief delay
        setTimeout(() => {
          setState((prev) => ({ ...prev, progress: 0 }));
        }, 1000);

        options.onSuccess?.(processedImage);
        return processedImage;
      } catch (error) {
        const appError = ErrorHandlingUtils.handleProcessingError(
          error,
          'Image processing',
        );
        ErrorHandlingUtils.logError(appError, 'useImageProcessing');

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: appError,
          progress: 0,
        }));

        options.onError?.(appError);
        throw appError;
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setState({
      processedImage: null,
      isProcessing: false,
      error: null,
      progress: 0,
      memoryUsage: ImageMemoryManager.getMemoryUsage(),
    });
  }, []);

  const cleanup = useCallback(async () => {
    await cleanupTempFiles();
    setState((prev) => ({
      ...prev,
      memoryUsage: ImageMemoryManager.getMemoryUsage(),
    }));
  }, []);

  return {
    ...state,
    processImage,
    reset,
    cleanup,
  };
};

/**
 * Hook for batch image processing
 */
export const useBatchImageProcessing = (
  options: ImageProcessingHookOptions = {},
) => {
  const [state, setState] = useState<{
    processedImages: ProcessedImage[];
    isProcessing: boolean;
    error: AppError | null;
    progress: number;
    currentIndex: number;
    totalCount: number;
  }>({
    processedImages: [],
    isProcessing: false,
    error: null,
    progress: 0,
    currentIndex: 0,
    totalCount: 0,
  });

  const processBatch = useCallback(
    async (
      imageUris: string[],
      processingOptions?: Partial<ImageProcessingOptions>,
    ) => {
      setState((prev) => ({
        ...prev,
        isProcessing: true,
        error: null,
        progress: 0,
        currentIndex: 0,
        totalCount: imageUris.length,
        processedImages: [],
      }));

      try {
        const processedImages = await ImageProcessor.batchProcess(
          imageUris,
          processingOptions,
          options.preset || 'api_upload',
        );

        setState((prev) => ({
          ...prev,
          processedImages,
          isProcessing: false,
          progress: 100,
          currentIndex: imageUris.length,
        }));

        // Reset progress after delay
        setTimeout(() => {
          setState((prev) => ({ ...prev, progress: 0 }));
        }, 1000);

        return processedImages;
      } catch (error) {
        const appError = ErrorHandlingUtils.handleProcessingError(
          error,
          'Batch image processing',
        );
        ErrorHandlingUtils.logError(appError, 'useBatchImageProcessing');

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: appError,
          progress: 0,
        }));

        throw appError;
      }
    },
    [options.preset],
  );

  const reset = useCallback(() => {
    setState({
      processedImages: [],
      isProcessing: false,
      error: null,
      progress: 0,
      currentIndex: 0,
      totalCount: 0,
    });
  }, []);

  return {
    ...state,
    processBatch,
    reset,
  };
};

/**
 * Hook for image validation with real-time feedback
 */
export const useImageValidation = () => {
  const [state, setState] = useState<{
    isValid: boolean | null;
    isValidating: boolean;
    error: AppError | null;
    validationInfo?: {
      size: number;
      format: string;
      width?: number;
      height?: number;
    };
  }>({
    isValid: null,
    isValidating: false,
    error: null,
    validationInfo: undefined,
  });

  const validateImage = useCallback(
    async (
      imageUri: string,
      validationOptions?: {
        maxSize?: number;
        maxWidth?: number;
        maxHeight?: number;
      },
    ) => {
      setState((prev) => ({ ...prev, isValidating: true, error: null }));

      try {
        const validation = await ImageValidator.validateImage(
          imageUri,
          validationOptions,
        );

        setState({
          isValid: validation.isValid,
          isValidating: false,
          error: validation.isValid
            ? null
            : {
                type: 'validation',
                message: validation.errors.join(', '),
              },
          validationInfo: validation.info,
        });

        return validation.isValid;
      } catch (error) {
        const appError = ErrorHandlingUtils.handleValidationError(error);
        ErrorHandlingUtils.logError(appError, 'useImageValidation');

        setState({
          isValid: false,
          isValidating: false,
          error: appError,
          validationInfo: undefined,
        });

        return false;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setState({
      isValid: null,
      isValidating: false,
      error: null,
      validationInfo: undefined,
    });
  }, []);

  return {
    ...state,
    validateImage,
    reset,
  };
};

/**
 * Convenience hooks for specific use cases
 */
export const useAPIImageProcessing = (
  options?: Omit<ImageProcessingHookOptions, 'preset'>,
) => useImageProcessing({ ...options, preset: 'api_upload' });

export const useThumbnailGeneration = (
  options?: Omit<ImageProcessingHookOptions, 'preset'>,
) => useImageProcessing({ ...options, preset: 'thumbnail' });

export const usePreviewGeneration = (
  options?: Omit<ImageProcessingHookOptions, 'preset'>,
) => useImageProcessing({ ...options, preset: 'preview' });

/**
 * Hook for enhanced image processing with caching
 */
export const useEnhancedImageProcessing = () => {
  const [state, setState] = useState<ImageProcessingState>({
    processedImage: null,
    isProcessing: false,
    error: null,
    progress: 0,
    memoryUsage: ImageMemoryManager.getMemoryUsage(),
  });

  // Process image with caching and memory management
  const processImageWithCache = useCallback(
    async (
      imageUri: string,
      options: ImageProcessingOptions & {
        enableCompression?: boolean;
        cacheKey?: string;
        priority?: 'low' | 'normal' | 'high';
      } = {},
    ) => {
      const {
        enableCompression = true,
        cacheKey,
        priority = 'normal',
        ...processingOptions
      } = options;

      setState((prev) => ({
        ...prev,
        isProcessing: true,
        error: null,
        progress: 0,
      }));

      try {
        // Check memory availability
        const memoryUsage = ImageMemoryManager.getMemoryUsage();
        if (memoryUsage.percentage > 90) {
          await ImageCache.cleanup();
        }

        setState((prev) => ({ ...prev, progress: 25 }));

        // Use enhanced caching
        const cached = await ImageCache.getCachedImage(imageUri, {
          enableCompression,
          cacheKey: cacheKey || imageUri,
          priority,
          ...processingOptions,
        });

        setState((prev) => ({ ...prev, progress: 75 }));

        // Convert to ProcessedImage format if needed
        let processedImage: ProcessedImage;

        if (cached.fromCache) {
          // For cached images, we need to convert to base64 if required
          processedImage = await ImageProcessor.convertToBase64(cached.uri);
        } else {
          // For new images, process normally
          processedImage = await ImageProcessor.processImage(
            imageUri,
            processingOptions,
          );
        }

        setState((prev) => ({
          ...prev,
          processedImage,
          isProcessing: false,
          progress: 100,
          memoryUsage: ImageMemoryManager.getMemoryUsage(),
        }));

        return processedImage;
      } catch (error) {
        const appError = ErrorHandlingUtils.handleProcessingError(
          error instanceof Error ? error : new Error(String(error)),
          'Enhanced image processing',
        );

        setState((prev) => ({
          ...prev,
          error: appError,
          isProcessing: false,
          progress: 0,
          memoryUsage: ImageMemoryManager.getMemoryUsage(),
        }));

        throw appError;
      }
    },
    [],
  );

  // Preload images for better performance
  const preloadImages = useCallback(async (imageUris: string[]) => {
    try {
      await ImageCache.preloadImages(imageUris, { priority: 'low' });
      setState((prev) => ({
        ...prev,
        memoryUsage: ImageMemoryManager.getMemoryUsage(),
      }));
    } catch (error) {
      console.warn('Image preload failed:', error);
    }
  }, []);

  // Clear specific image from cache
  const clearImageCache = useCallback((cacheKey: string) => {
    ImageCache.clearImage(cacheKey);
    setState((prev) => ({
      ...prev,
      memoryUsage: ImageMemoryManager.getMemoryUsage(),
    }));
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    return ImageCache.getCacheStats();
  }, []);

  return {
    ...state,
    processImageWithCache,
    preloadImages,
    clearImageCache,
    getCacheStats,
  };
};

/**
 * Hook for memory monitoring
 */
export const useImageMemoryMonitor = () => {
  const [memoryUsage, setMemoryUsage] = useState(
    ImageMemoryManager.getMemoryUsage(),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setMemoryUsage(ImageMemoryManager.getMemoryUsage());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const forceCleanup = useCallback(async () => {
    await cleanupTempFiles();
    ImageCache.clearAll();
    ImageMemoryManager.reset();
    setMemoryUsage(ImageMemoryManager.getMemoryUsage());
  }, []);

  return {
    memoryUsage,
    forceCleanup,
    isMemoryHigh: memoryUsage.percentage > 80,
    isMemoryCritical: memoryUsage.percentage > 95,
  };
};
