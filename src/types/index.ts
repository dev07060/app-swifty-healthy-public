// Core data models for the Health Tracker App

export interface BaseEntry {
  id: string;
  type: 'exercise' | 'food';
  date: string; // YYYY-MM-DD format
  timestamp: string; // ISO 8601 format
  createdAt: string;
}

export interface ExerciseEntry extends BaseEntry {
  type: 'exercise';
  exerciseType: string;
  duration: number; // minutes
  calories: number;
  distance?: number; // km (for walking, cycling, running, etc.)
  originalImagePath?: string;
}

export interface FoodEntry extends BaseEntry {
  type: 'food';
  isHealthy: boolean;
  mainIngredients: string[];
  estimatedCalories: number;
  mealType: string; // breakfast, lunch, dinner, snack
  originalImagePath?: string;
}

export type AuthenticationEntry = ExerciseEntry | FoodEntry;

// API Response Types
export interface GeminiExerciseResponse {
  exerciseType: string;
  duration: number; // minutes
  calories: number;
  date: string;
  distance?: number; // km (for walking, cycling, running, etc.)
}

export interface Ingredient {
  name: string;
  color: 'red' | 'green' | 'teal';
}

export interface GeminiFoodResponse {
  isHealthy: boolean;
  ingredients: Ingredient[];
  estimatedCalories: number;
  mealType: string;
  date: string;
}

// Metadata and validation types
export interface ImageMetadata {
  timestamp: string;
  dateTime: string;
  gpsLocation?: {
    latitude: number;
    longitude: number;
  };
  deviceInfo?: {
    make: string;
    model: string;
  };
}

// Weekly stats for reports
export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  exerciseCount: number;
  foodCount: number;
  totalCaloriesBurned: number;
  totalCaloriesConsumed: number;
  healthyFoodPercentage: number;
}

// Error handling types
export type AppError =
  | { type: 'network'; message: string; shouldRetry: boolean }
  | { type: 'validation'; message: string; field?: string }
  | { type: 'processing'; message: string; details?: any }
  | { type: 'storage'; message: string }
  | { type: 'permission'; message: string; permission: string };

// State management types
export interface HealthTrackerState {
  // Data
  entries: AuthenticationEntry[];
  isLoading: boolean;
  error: string | null;

  // Actions
  addExerciseEntry: (entry: Omit<ExerciseEntry, 'id' | 'createdAt'>) => void;
  addFoodEntry: (entry: Omit<FoodEntry, 'id' | 'createdAt'>) => void;
  removeEntry: (id: string) => void;
  clearError: () => void;

  // Computed
  getEntriesByDateRange: (
    startDate: string,
    endDate: string,
  ) => AuthenticationEntry[];
  getWeeklyStats: (weekStart: string) => WeeklyStats;
}

// Navigation types for Granite routing
export type NavigationParams = {
  MainUpload: undefined;
  ExerciseUpload: undefined;
  FoodUpload: undefined;
  Reports: undefined;
  GraphTest: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  ExerciseUpload: undefined;
  FoodUpload: undefined;
};

export type MainTabParamList = {
  Upload: undefined;
  Reports: undefined;
};

// API client interfaces
export interface GeminiAPIClient {
  analyzeExerciseScreenshot(imageData: string): Promise<GeminiExerciseResponse>;
  analyzeFoodPhoto(imageData: string): Promise<GeminiFoodResponse>;
}

export interface MetadataExtractor {
  // For food photos - uses filename patterns and fallbacks
  validateFoodPhoto(imagePath: string): Promise<boolean>;
  extractMetadata(imagePath: string): Promise<ImageMetadata>;

  // For exercise screenshots - uses OCR text validation
  validateExerciseScreenshot(ocrText: string): boolean;
  extractDateFromText(text: string): string | null;
}

// Gemini API types
export interface GeminiAPIRequest {
  contents: Array<{
    parts: Array<{
      text?: string;
      inline_data?: {
        mime_type: string;
        data: string;
      };
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
}

export interface GeminiAPIResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export interface ProcessedImage {
  base64: string;
  mimeType: string;
  size: number;
}

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png';
}
