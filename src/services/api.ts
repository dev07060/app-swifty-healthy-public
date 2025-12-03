import type { ExerciseEntry, FoodEntry } from '../types';

// Use environment variable if available, fallback to production URL
const API_BASE_URL = process.env.API_BASE_URL || 'https://swifty-backend-api-udeke3xipq-du.a.run.app';

export interface ExerciseLogResponse {
  id: number;
  userKey: string;
  exerciseType: string | null;
  duration: number | null;
  calories: number | null;
  distance: number | null;
  date: string | null;
  createdAt: string;
}

export interface FoodIngredientResponse {
  name: string;
  color: string;
}

export interface FoodLogResponse {
  id: number;
  userKey: string;
  isHealthy: boolean | null;
  estimatedCalories: number | null;
  mealType: string | null;
  date: string | null;
  ingredients: FoodIngredientResponse[];
  createdAt: string;
}

export const apiService = {
  async getTodayExerciseLogs(userKey: string): Promise<ExerciseEntry[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/log/exercise/today?userKey=${encodeURIComponent(userKey)}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch exercise logs: ${response.statusText}`);
    }

    const data: ExerciseLogResponse[] = await response.json();

    return data.map((log) => ({
      id: log.id.toString(),
      type: 'exercise' as const,
      userKey: log.userKey,
      exerciseType: log.exerciseType ?? '',
      duration: log.duration ?? 0,
      calories: log.calories ?? 0,
      distance: log.distance ?? 0,
      date: (log.date || new Date().toISOString().split('T')[0]) as string,
      createdAt: log.createdAt,
      timestamp: log.createdAt,
    }));
  },

  async getTodayFoodLogs(userKey: string): Promise<FoodEntry[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/log/food/today?userKey=${encodeURIComponent(userKey)}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch food logs: ${response.statusText}`);
    }

    const data: FoodLogResponse[] = await response.json();

    return data.map((log) => ({
      id: log.id.toString(),
      type: 'food' as const,
      userKey: log.userKey,
      isHealthy: log.isHealthy ?? false,
      estimatedCalories: log.estimatedCalories ?? 0,
      mealType: log.mealType ?? '',
      mainIngredients: log.ingredients.map((ing) => ing.name),
      date: (log.date || new Date().toISOString().split('T')[0]) as string,
      createdAt: log.createdAt,
      timestamp: log.createdAt,
    }));
  },
};
