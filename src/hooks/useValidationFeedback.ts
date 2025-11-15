import { useCallback, useState } from 'react';
import { type AppError, ErrorHandlingUtils } from '../utils/errorHandling';

interface ValidationRule<T> {
  validate: (value: T) => boolean | Promise<boolean>;
  message: string;
  field?: string;
}

interface ValidationState {
  isValid: boolean | null;
  isValidating: boolean;
  errors: AppError[];
  fieldErrors: Record<string, AppError>;
}

export const useValidationFeedback = <T>() => {
  const [state, setState] = useState<ValidationState>({
    isValid: null,
    isValidating: false,
    errors: [],
    fieldErrors: {},
  });

  const validateField = useCallback(
    async (
      value: T,
      rules: ValidationRule<T>[],
      fieldName?: string,
    ): Promise<boolean> => {
      setState((prev) => ({ ...prev, isValidating: true }));

      const errors: AppError[] = [];
      const fieldErrors: Record<string, AppError> = { ...state.fieldErrors };

      try {
        for (const rule of rules) {
          const isValid = await Promise.resolve(rule.validate(value));
          if (!isValid) {
            const error = ErrorHandlingUtils.handleValidationError(
              new Error(rule.message),
              rule.field || fieldName,
            );
            errors.push(error);

            if (rule.field) {
              fieldErrors[rule.field] = error;
            } else if (fieldName) {
              fieldErrors[fieldName] = error;
            }
          }
        }

        // Clear field error if validation passes
        if (errors.length === 0 && fieldName) {
          delete fieldErrors[fieldName];
        }

        const isValid = errors.length === 0;
        setState({
          isValid,
          isValidating: false,
          errors,
          fieldErrors,
        });

        return isValid;
      } catch (error) {
        const appError = ErrorHandlingUtils.handleValidationError(error);
        setState({
          isValid: false,
          isValidating: false,
          errors: [appError],
          fieldErrors: fieldName ? { [fieldName]: appError } : {},
        });
        return false;
      }
    },
    [state.fieldErrors],
  );

  const validateForm = useCallback(
    async (
      formData: Record<string, unknown>,
      fieldRules: Record<string, ValidationRule<unknown>[]>,
    ): Promise<boolean> => {
      setState((prev) => ({ ...prev, isValidating: true }));

      const allErrors: AppError[] = [];
      const allFieldErrors: Record<string, AppError> = {};

      try {
        for (const [fieldName, rules] of Object.entries(fieldRules)) {
          const value = formData[fieldName];

          for (const rule of rules) {
            const isValid = await Promise.resolve(rule.validate(value));
            if (!isValid) {
              const error = ErrorHandlingUtils.handleValidationError(
                new Error(rule.message),
                fieldName,
              );
              allErrors.push(error);
              allFieldErrors[fieldName] = error;
              break; // Stop at first error for this field
            }
          }
        }

        const isValid = allErrors.length === 0;
        setState({
          isValid,
          isValidating: false,
          errors: allErrors,
          fieldErrors: allFieldErrors,
        });

        return isValid;
      } catch (error) {
        const appError = ErrorHandlingUtils.handleValidationError(error);
        setState({
          isValid: false,
          isValidating: false,
          errors: [appError],
          fieldErrors: {},
        });
        return false;
      }
    },
    [],
  );

  const clearValidation = useCallback(() => {
    setState({
      isValid: null,
      isValidating: false,
      errors: [],
      fieldErrors: {},
    });
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setState((prev) => {
      const newFieldErrors = { ...prev.fieldErrors };
      delete newFieldErrors[fieldName];

      return {
        ...prev,
        fieldErrors: newFieldErrors,
        errors: prev.errors.filter(
          (error) => error.type !== 'validation' || error.field !== fieldName,
        ),
      };
    });
  }, []);

  const getFieldError = useCallback(
    (fieldName: string): AppError | null => {
      return state.fieldErrors[fieldName] || null;
    },
    [state.fieldErrors],
  );

  const hasFieldError = useCallback(
    (fieldName: string): boolean => {
      return fieldName in state.fieldErrors;
    },
    [state.fieldErrors],
  );

  return {
    ...state,
    validateField,
    validateForm,
    clearValidation,
    clearFieldError,
    getFieldError,
    hasFieldError,
  };
};

// Common validation rules
export const ValidationRules = {
  required: <T>(message = 'This field is required'): ValidationRule<T> => ({
    validate: (value: T) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value: string) => !value || value.length >= min,
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value: string) => !value || value.length <= max,
    message: message || `Must be no more than ${max} characters`,
  }),

  email: (
    message = 'Must be a valid email address',
  ): ValidationRule<string> => ({
    validate: (value: string) => {
      if (!value) return true; // Allow empty for optional fields
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message,
  }),

  numeric: (message = 'Must be a number'): ValidationRule<string | number> => ({
    validate: (value: string | number) => {
      if (!value && value !== 0) return true; // Allow empty for optional fields
      return !Number.isNaN(Number(value));
    },
    message,
  }),

  positive: (
    message = 'Must be a positive number',
  ): ValidationRule<number> => ({
    validate: (value: number) => value > 0,
    message,
  }),

  dateFormat: (
    message = 'Must be a valid date (YYYY-MM-DD)',
  ): ValidationRule<string> => ({
    validate: (value: string) => {
      if (!value) return true; // Allow empty for optional fields
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(value)) return false;
      const date = new Date(value);
      return date.toISOString().split('T')[0] === value;
    },
    message,
  }),

  custom: <T>(
    validator: (value: T) => boolean | Promise<boolean>,
    message: string,
  ): ValidationRule<T> => ({
    validate: validator,
    message,
  }),
};
