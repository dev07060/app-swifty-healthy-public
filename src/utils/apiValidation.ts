import type {
  GeminiAPIRequest,
  GeminiExerciseResponse,
  GeminiFoodResponse,
} from '../types';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

/**
 * Validates Gemini API exercise response structure
 */
export const validateGeminiExerciseResponse = (
  response: any,
): response is GeminiExerciseResponse => {
  if (!response || typeof response !== 'object') {
    return false;
  }

  const requiredFields = [
    'exerciseType',
    'duration',
    'calories',
    'date',
    'confidence',
  ];

  for (const field of requiredFields) {
    if (!(field in response)) {
      return false;
    }
  }

  // Validate field types
  if (
    typeof response.exerciseType !== 'string' ||
    response.exerciseType.trim() === ''
  ) {
    return false;
  }

  if (
    typeof response.duration !== 'string' ||
    !isValidDurationFormat(response.duration)
  ) {
    return false;
  }

  if (typeof response.calories !== 'number' || response.calories < 0) {
    return false;
  }

  if (typeof response.date !== 'string' || !isValidDateFormat(response.date)) {
    return false;
  }

  if (
    typeof response.confidence !== 'number' ||
    response.confidence < 0 ||
    response.confidence > 1
  ) {
    return false;
  }

  return true;
};

/**
 * Validates Gemini API food response structure
 */
export const validateGeminiFoodResponse = (
  response: any,
): response is GeminiFoodResponse => {
  if (!response || typeof response !== 'object') {
    return false;
  }

  const requiredFields = [
    'isHealthy',
    'mainIngredients',
    'estimatedCalories',
    'mealType',
    'date',
    'confidence',
  ];

  for (const field of requiredFields) {
    if (!(field in response)) {
      return false;
    }
  }

  // Validate field types
  if (typeof response.isHealthy !== 'boolean') {
    return false;
  }

  if (
    !Array.isArray(response.mainIngredients) ||
    response.mainIngredients.length === 0
  ) {
    return false;
  }

  // Validate all ingredients are strings
  if (
    !response.mainIngredients.every(
      (ingredient: any) =>
        typeof ingredient === 'string' && ingredient.trim() !== '',
    )
  ) {
    return false;
  }

  if (
    typeof response.estimatedCalories !== 'number' ||
    response.estimatedCalories < 0
  ) {
    return false;
  }

  if (
    typeof response.mealType !== 'string' ||
    !isValidMealType(response.mealType)
  ) {
    return false;
  }

  if (typeof response.date !== 'string' || !isValidDateFormat(response.date)) {
    return false;
  }

  if (
    typeof response.confidence !== 'number' ||
    response.confidence < 0 ||
    response.confidence > 1
  ) {
    return false;
  }

  return true;
};

/**
 * Validates Gemini API request structure
 */
export const validateGeminiAPIRequest = (
  request: any,
): request is GeminiAPIRequest => {
  if (!request || typeof request !== 'object') {
    return false;
  }

  const requiredFields = ['image', 'prompt', 'model'];

  for (const field of requiredFields) {
    if (!(field in request)) {
      return false;
    }
  }

  // Validate field types
  if (typeof request.image !== 'string' || request.image.trim() === '') {
    return false;
  }

  if (typeof request.prompt !== 'string' || request.prompt.trim() === '') {
    return false;
  }

  if (typeof request.model !== 'string' || request.model.trim() === '') {
    return false;
  }

  // Validate base64 image format (basic check)
  if (!isValidBase64Image(request.image)) {
    return false;
  }

  return true;
};

/**
 * Validates API response structure
 */
export const validateApiResponse = <T>(
  response: any,
): response is ApiResponse<T> => {
  if (!response || typeof response !== 'object') {
    return false;
  }

  if (typeof response.success !== 'boolean') {
    return false;
  }

  if (typeof response.timestamp !== 'string') {
    return false;
  }

  // If success is false, error should be present
  if (!response.success && !response.error) {
    return false;
  }

  // If error is present, validate its structure
  if (response.error) {
    if (typeof response.error !== 'object') {
      return false;
    }

    if (
      typeof response.error.code !== 'string' ||
      typeof response.error.message !== 'string'
    ) {
      return false;
    }
  }

  return true;
};

/**
 * Creates a standardized error response
 */
export const createErrorResponse = <T>(
  code: string,
  message: string,
  details?: any,
): ApiResponse<T> => {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Creates a standardized success response
 */
export const createSuccessResponse = <T>(data: T): ApiResponse<T> => {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Helper function to validate duration format (HH:MM:SS)
 */
const isValidDurationFormat = (duration: string): boolean => {
  const durationRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
  return durationRegex.test(duration);
};

/**
 * Helper function to validate date format (YYYY-MM-DD)
 */
const isValidDateFormat = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;

  const parsedDate = new Date(date);
  return parsedDate.toISOString().split('T')[0] === date;
};

/**
 * Helper function to validate meal type
 */
const isValidMealType = (mealType: string): boolean => {
  const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  return validMealTypes.includes(mealType.toLowerCase());
};

/**
 * Helper function to validate base64 image format (basic validation)
 */
const isValidBase64Image = (base64String: string): boolean => {
  // Check if it's a valid base64 string
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;

  // Remove data URL prefix if present
  const base64Data = base64String.includes(',')
    ? base64String.split(',')[1]
    : base64String;

  if (!base64Data || base64Data.length === 0) {
    return false;
  }

  // Check if it matches base64 pattern
  if (!base64Regex.test(base64Data)) {
    return false;
  }

  // Check if length is valid (base64 strings should be divisible by 4)
  if (base64Data.length % 4 !== 0) {
    return false;
  }

  return true;
};

/**
 * Sanitizes and validates exercise type string
 */
export const sanitizeExerciseType = (exerciseType: string): string => {
  return exerciseType
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '');
};

/**
 * Sanitizes and validates ingredient strings
 */
export const sanitizeIngredients = (mainIngredients: string[]): string[] => {
  return mainIngredients
    .map((ingredient) => ingredient.trim())
    .filter((ingredient) => ingredient.length > 0)
    .map((ingredient) => ingredient.toLowerCase());
};

/**
 * Validates confidence score is within acceptable range
 */
export const isValidConfidenceScore = (confidence: number): boolean => {
  return typeof confidence === 'number' && confidence >= 0 && confidence <= 1;
};

/**
 * Checks if confidence score meets minimum threshold
 */
export const meetsConfidenceThreshold = (
  confidence: number,
  threshold = 0.7,
): boolean => {
  return isValidConfidenceScore(confidence) && confidence >= threshold;
};
