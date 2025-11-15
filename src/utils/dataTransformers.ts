import type {
  AuthenticationEntry,
  ExerciseEntry,
  FoodEntry,
  GeminiExerciseResponse,
  GeminiFoodResponse,
  WeeklyStats,
} from '../types';

/**
 * Generates a unique ID for entries
 */
export const generateEntryId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Gets current date in YYYY-MM-DD format
 */
export const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0]!;
};

/**
 * Gets current timestamp in ISO 8601 format
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Transforms Gemini API exercise response to ExerciseEntry
 */
export const transformGeminiExerciseResponse = (
  response: GeminiExerciseResponse,
  originalImagePath?: string,
): ExerciseEntry => {
  const now = getCurrentTimestamp();

  return {
    id: generateEntryId(),
    type: 'exercise',
    exerciseType: response.exerciseType,
    duration: response.duration,
    calories: response.calories,
    date: response.date,
    timestamp: now,
    createdAt: now,
    originalImagePath,
  };
};

/**
 * Transforms Gemini API food response to FoodEntry
 */
export const transformGeminiFoodResponse = (
  response: GeminiFoodResponse,
  originalImagePath?: string,
): FoodEntry => {
  const now = getCurrentTimestamp();

  return {
    id: generateEntryId(),
    type: 'food',
    isHealthy: response.isHealthy,
    mainIngredients: response.mainIngredients,
    estimatedCalories: response.estimatedCalories,
    mealType: response.mealType,
    date: response.date,
    timestamp: now,
    createdAt: now,
    originalImagePath,
  };
};

/**
 * Validates if a date string matches current calendar date
 */
export const isCurrentDate = (dateString: string): boolean => {
  const currentDate = getCurrentDate();
  return dateString === currentDate;
};

/**
 * Calculates weekly statistics from authentication entries
 */
const calculateWeeklyStats = (
  entries: AuthenticationEntry[],
  weekStart: string,
): WeeklyStats => {
  const weekStartDate = new Date(weekStart);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  const weekEnd = weekEndDate.toISOString().split('T')[0]!;

  const weekEntries = entries.filter((entry) => {
    return entry.date >= weekStart && entry.date <= weekEnd;
  });

  const exerciseEntries = weekEntries.filter(
    (entry) => entry.type === 'exercise',
  ) as ExerciseEntry[];
  const foodEntries = weekEntries.filter(
    (entry) => entry.type === 'food',
  ) as FoodEntry[];

  const totalCaloriesBurned = exerciseEntries.reduce(
    (sum, entry) => sum + entry.calories,
    0,
  );
  const totalCaloriesConsumed = foodEntries.reduce(
    (sum, entry) => sum + entry.estimatedCalories,
    0,
  );

  const healthyFoodCount = foodEntries.filter(
    (entry) => entry.isHealthy,
  ).length;
  const healthyFoodPercentage =
    foodEntries.length > 0 ? (healthyFoodCount / foodEntries.length) * 100 : 0;

  return {
    weekStart,
    weekEnd: weekEnd,
    exerciseCount: exerciseEntries.length,
    foodCount: foodEntries.length,
    totalCaloriesBurned,
    totalCaloriesConsumed,
    healthyFoodPercentage: Math.round(healthyFoodPercentage * 100) / 100, // Round to 2 decimal places
  };
};
export default calculateWeeklyStats

/**
 * Gets entries within a specific date range
 */
export const getEntriesByDateRange = (
  entries: AuthenticationEntry[],
  startDate: string,
  endDate: string,
): AuthenticationEntry[] => {
  return entries.filter((entry) => {
    return entry.date >= startDate && entry.date <= endDate;
  });
};

/**
 * Validates exercise entry data
 */
export const validateExerciseEntry = (
  entry: Partial<ExerciseEntry>,
): string[] => {
  const errors: string[] = [];

  if (!entry.exerciseType || entry.exerciseType.trim() === '') {
    errors.push('Exercise type is required');
  }

  if (!entry.duration || !isValidDuration(entry.duration)) {
    errors.push('Valid duration in HH:MM:SS format is required');
  }

  if (typeof entry.calories !== 'number' || entry.calories < 0) {
    errors.push('Calories must be a positive number');
  }

  if (!entry.date || !isValidDate(entry.date)) {
    errors.push('Valid date in YYYY-MM-DD format is required');
  }

  return errors;
};

/**
 * Validates food entry data
 */
export const validateFoodEntry = (entry: Partial<FoodEntry>): string[] => {
  const errors: string[] = [];

  if (typeof entry.isHealthy !== 'boolean') {
    errors.push('Health classification is required');
  }

  if (
    !entry.mainIngredients ||
    !Array.isArray(entry.mainIngredients) ||
    entry.mainIngredients.length === 0
  ) {
    errors.push('At least one main ingredient is required');
  }

  if (
    typeof entry.estimatedCalories !== 'number' ||
    entry.estimatedCalories < 0
  ) {
    errors.push('Estimated calories must be a positive number');
  }

  if (!entry.mealType || !isValidMealType(entry.mealType)) {
    errors.push(
      'Valid meal type is required (breakfast, lunch, dinner, snack)',
    );
  }

  if (!entry.date || !isValidDate(entry.date)) {
    errors.push('Valid date in YYYY-MM-DD format is required');
  }

  return errors;
};

/**
 * Helper function to validate duration format (HH:MM:SS)
 */
const isValidDuration = (duration: string): boolean => {
  const durationRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
  return durationRegex.test(duration);
};

/**
 * Helper function to validate date format (YYYY-MM-DD)
 */
const isValidDate = (date: string): boolean => {
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
 * Sorts entries by date and timestamp (newest first)
 */
export const sortEntriesByDate = (
  entries: AuthenticationEntry[],
): AuthenticationEntry[] => {
  return [...entries].sort((a, b) => {
    // First sort by date (newest first)
    const dateComparison = b.date.localeCompare(a.date);
    if (dateComparison !== 0) return dateComparison;

    // If dates are equal, sort by timestamp (newest first)
    return b.timestamp.localeCompare(a.timestamp);
  });
};

/**
 * Groups entries by date
 */
export const groupEntriesByDate = (
  entries: AuthenticationEntry[],
): Record<string, AuthenticationEntry[]> => {
  return entries.reduce(
    (groups, entry) => {
      const date = entry.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date]?.push(entry);
      return groups;
    },
    {} as Record<string, AuthenticationEntry[]>,
  );
};
