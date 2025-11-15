export interface User {
  userKey: string;
  gender: 'male' | 'female' | 'other';
  ageRange: string;
}

export interface ExerciseLog {
  userKey: string;
  exerciseType: string;
  duration: number;
  calories: number;
  date: string;
  distance?: number;
}

export interface FoodIngredient {
  name: string;
  color: 'red' | 'green' | 'teal';
}

export interface FoodLog {
  userKey: string;
  isHealthy: boolean;
  ingredients: FoodIngredient[];
  estimatedCalories: number;
  mealType: string;
  date: string;
}

export type CreateUserPayload = Omit<User, 'userKey'> & { userKey: string };
export type LogExercisePayload = ExerciseLog;
export type LogFoodPayload = FoodLog;

// Assuming the API returns the created object
export type CreateUserResponse = User;
export type LogExerciseResponse = ExerciseLog & { id: string };
export type LogFoodResponse = FoodLog & { id: string };
