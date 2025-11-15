import { GeminiAPIError } from '../services/GeminiAPIClient';

// Error types for consistent handling across the app
export type AppError =
  | { type: 'network'; message: string; shouldRetry: boolean; code?: string }
  | { type: 'validation'; message: string; field?: string; details?: any }
  | {
      type: 'processing';
      message: string;
      details?: any;
      shouldRetry?: boolean;
    }
  | { type: 'storage'; message: string; operation?: string }
  | { type: 'permission'; message: string; permission: string }
  | {
      type: 'api';
      message: string;
      shouldRetry: boolean;
      statusCode?: number;
      code?: string;
    }
  | { type: 'unknown'; message: string };

// Error handling utilities
export class ErrorHandlingUtils {
  /**
   * Handles API errors and converts them to AppError format
   */
  static handleApiError(error: any): AppError {
    if (error instanceof GeminiAPIError) {
      const shouldRetry =
        error.code === 'TIMEOUT_ERROR' ||
        error.code === 'NETWORK_ERROR' ||
        (error.statusCode !== undefined && error.statusCode >= 500);

      return {
        type: 'api',
        message: error.message,
        shouldRetry: Boolean(shouldRetry),
        statusCode: error.statusCode,
        code: error.code,
      };
    }

    // Handle fetch/network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        type: 'network',
        message:
          'Network connection failed. Please check your internet connection.',
        shouldRetry: true,
      };
    }

    // Handle timeout errors
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return {
        type: 'network',
        message: 'Request timed out. Please try again.',
        shouldRetry: true,
      };
    }

    return {
      type: 'api',
      message: error.message || 'An unexpected error occurred',
      shouldRetry: false,
    };
  }

  /**
   * Handles validation errors
   */
  static handleValidationError(error: any, field?: string): AppError {
    return {
      type: 'validation',
      message: error.message || 'Validation failed',
      field,
      details: error.details,
    };
  }

  /**
   * Handles storage errors (AsyncStorage)
   */
  static handleStorageError(error: any, operation?: string): AppError {
    let message = 'Storage operation failed';

    if (operation) {
      message = `Failed to ${operation} data`;
    }

    // Handle quota exceeded errors
    if (error.message?.includes('quota')) {
      message = 'Storage is full. Please free up some space and try again.';
    }

    return {
      type: 'storage',
      message: error.message || message,
      operation,
    };
  }

  /**
   * Handles permission errors
   */
  static handlePermissionError(permission: string, error?: any): AppError {
    const permissionMessages = {
      camera:
        'Camera access is required to take photos. Please enable camera permissions in your device settings.',
      photos:
        'Photo library access is required to select images. Please enable photo permissions in your device settings.',
      storage:
        'Storage access is required to save your data. Please enable storage permissions in your device settings.',
    };

    return {
      type: 'permission',
      message:
        permissionMessages[permission as keyof typeof permissionMessages] ||
        `${permission} permission is required for this feature.`,
      permission,
    };
  }

  /**
   * Handles processing errors (image processing, data transformation)
   */
  static handleProcessingError(error: any, context?: string): AppError {
    let message = 'Processing failed';

    if (context) {
      message = `${context} processing failed`;
    }

    const shouldRetry =
      !error.message?.includes('format') && !error.message?.includes('invalid');

    return {
      type: 'processing',
      message: error.message || message,
      details: error.details,
      shouldRetry,
    };
  }

  /**
   * Formats error messages for user display
   */
  static formatUserMessage(error: AppError): string {
    switch (error.type) {
      case 'network':
        return error.message;

      case 'api':
        if (error.code === 'CONFIGURATION_ERROR') {
          return 'App configuration error. Please contact support.';
        }
        if (error.statusCode === 429) {
          return 'Too many requests. Please wait a moment and try again.';
        }
        if (error.statusCode === 401 || error.statusCode === 403) {
          return 'Authentication failed. Please check your API configuration.';
        }
        return error.message;

      case 'validation':
        return error.message;

      case 'processing':
        return error.message;

      case 'storage':
        return error.message;

      case 'permission':
        return error.message;

      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Determines if an error should show a retry option
   */
  static shouldShowRetry(error: AppError): boolean {
    switch (error.type) {
      case 'network':
      case 'api':
        return error.shouldRetry;
      case 'processing':
        return error.shouldRetry ?? false;
      case 'storage':
        return true; // Storage operations can usually be retried
      case 'validation':
      case 'permission':
        return false; // These require user action, not retry
      default:
        return false;
    }
  }

  /**
   * Gets appropriate retry delay in milliseconds
   */
  static getRetryDelay(error: AppError, attemptNumber = 1): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 10000; // 10 seconds

    // Exponential backoff with jitter
    const delay = Math.min(baseDelay * 2 ** (attemptNumber - 1), maxDelay);
    const jitter = Math.random() * 0.1 * delay; // Add up to 10% jitter

    return Math.floor(delay + jitter);
  }

  /**
   * Logs errors for debugging (in development mode)
   */
  static logError(error: AppError, context: string, originalError?: any): void {
    if (__DEV__) {
      console.group(`🚨 Error in ${context}`);
      console.error('Formatted error:', error);
      if (originalError) {
        console.error('Original error:', originalError);
      }
      console.groupEnd();
    }
  }

  /**
   * Creates a user-friendly error summary
   */
  static createErrorSummary(errors: AppError[]): string {
    if (errors.length === 0) return '';
    if (errors.length === 1) {
      const firstError = errors[0];
      if (firstError) {
        return ErrorHandlingUtils.formatUserMessage(firstError);
      }
      return '';
    }

    const errorTypes = [...new Set(errors.map((e) => e.type))];

    if (errorTypes.length === 1) {
      return `Multiple ${errorTypes[0]} errors occurred. Please try again.`;
    }

    return `Multiple errors occurred (${errorTypes.join(', ')}). Please try again.`;
  }
}

// Utility functions for common error scenarios
export const createNetworkError = (message?: string): AppError => ({
  type: 'network',
  message: message || 'Network connection failed',
  shouldRetry: true,
});

export const createValidationError = (
  message: string,
  field?: string,
): AppError => ({
  type: 'validation',
  message,
  field,
});

export const createPermissionError = (permission: string): AppError =>
  ErrorHandlingUtils.handlePermissionError(permission);

export const createStorageError = (
  message?: string,
  operation?: string,
): AppError => ({
  type: 'storage',
  message: message || 'Storage operation failed',
  operation,
});

// Error boundary helper for React components
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: string,
) => {
  return async (...args: T): Promise<{ data?: R; error?: AppError }> => {
    try {
      const data = await fn(...args);
      return { data };
    } catch (error) {
      const appError = ErrorHandlingUtils.handleApiError(error);
      ErrorHandlingUtils.logError(appError, context, error);
      return { error: appError };
    }
  };
};
