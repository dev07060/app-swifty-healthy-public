import { useCallback, useState } from 'react';
import type { ProcessedImage } from '../types';
import { type AppError, ErrorHandlingUtils } from '../utils/errorHandling';

interface AsyncOperationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: AppError) => void;
  retryDelay?: number;
}

export const useAsyncOperation = <T>(
  // Removed default any
  operation: (...args: any[]) => Promise<T>,
  options: AsyncOperationOptions<T> = {},
) => {
  const [state, setState] = useState<{
    isLoading: boolean;
    error: AppError | null;
    data: T | null;
  }>({
    isLoading: false,
    error: null,
    data: null,
  });

  const execute = useCallback(
    async (...args: any[]) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const result = await operation(...args);
        setState((prev) => ({ ...prev, isLoading: false, data: result }));
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const appError = ErrorHandlingUtils.handleProcessingError(
          err instanceof Error ? err : new Error(String(err)),
          'Async Operation',
        );
        setState((prev) => ({ ...prev, isLoading: false, error: appError }));
        options.onError?.(appError);
        ErrorHandlingUtils.logError(appError, 'useAsyncOperation', err);
        throw appError;
      }
    },
    [operation, options.onSuccess, options.onError],
  );

  const retry = useCallback(
    async (...args: any[]) => {
      if (!state.error || !ErrorHandlingUtils.shouldShowRetry(state.error)) {
        return;
      }

      if (options.retryDelay) {
        await new Promise((resolve) => setTimeout(resolve, options.retryDelay));
      }
      await execute(...args);
    },
    [state.error, options.retryDelay, execute],
  );

  return {
    ...state,
    execute,
    retry,
    reset: () => setState({ isLoading: false, error: null, data: null }),
  };
};

// Specialized hook for image upload operations
export const useImageUpload = (
  uploadFunction: (imageUri: string) => Promise<ProcessedImage>,
  options: AsyncOperationOptions<ProcessedImage> = {},
) => {
  return useAsyncOperation(uploadFunction, options);
};

// Hook for validation operations
export const useValidation = <T>(
  validator: (data: T) => Promise<boolean> | boolean,
  options: AsyncOperationOptions<T> = {},
) => {
  const [validationState, setValidationState] = useState<{
    isValid: boolean | null;
    isValidating: boolean;
    error: AppError | null;
  }>({
    isValid: null,
    isValidating: false,
    error: null,
  });

  const validate = useCallback(
    async (data: T) => {
      setValidationState((prev) => ({
        ...prev,
        isValidating: true,
        error: null,
      }));

      try {
        const result = await Promise.resolve(validator(data));
        setValidationState({
          isValid: result,
          isValidating: false,
          error: null,
        });

        if (result) {
          options.onSuccess?.(data);
        }

        return result;
      } catch (error) {
        const appError = ErrorHandlingUtils.handleValidationError(error);
        ErrorHandlingUtils.logError(appError, 'useValidation', error);

        setValidationState({
          isValid: false,
          isValidating: false,
          error: appError,
        });

        options.onError?.(appError);
        return false;
      }
    },
    [validator, options],
  );

  const reset = useCallback(() => {
    setValidationState({
      isValid: null,
      isValidating: false,
      error: null,
    });
  }, []);

  return {
    ...validationState,
    validate,
    reset,
  };
};
