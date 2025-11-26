// Configuration management using react-native-config

import Config from 'react-native-config';

// Environment configuration interface
interface AppConfig {
  // API Configuration
  API_BASE_URL: string;
  API_KEY: string;

  // Gemini API Configuration
  GEMINI_API_KEY: string;
  GEMINI_API_URL: string;

  // App Configuration
  APP_ENV: 'development' | 'staging' | 'production';
  DEBUG_MODE: boolean;

  // Feature Flags
  ENABLE_ANALYTICS: boolean;
  ENABLE_CRASH_REPORTING: boolean;
  USE_BACKEND_ANALYSIS: boolean;
}

// Parse boolean values from environment strings
const parseBoolean = (value: string | undefined): boolean => {
  return value?.toLowerCase() === 'true';
};

// Validate required environment variables
const validateConfig = (): void => {
  // Validation is now done at runtime when API is actually used
  // No need to warn on app startup
};

// Create typed configuration object
export const appConfig: AppConfig = {
  // API Configuration
  API_BASE_URL: Config.API_BASE_URL || 'http://127.0.0.1:8000',
  API_KEY: Config.API_KEY || '',

  // Gemini API Configuration
  GEMINI_API_KEY: 'AIzaSyBc6I25huwj2BXNLC4g6xoj_XFjs3KBOrI',
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',

  // App Configuration
  APP_ENV:
    (Config.APP_ENV as 'development' | 'staging' | 'production') ||
    'development',
  DEBUG_MODE: parseBoolean(Config.DEBUG_MODE),

  // Feature Flags
  ENABLE_ANALYTICS: parseBoolean(Config.ENABLE_ANALYTICS),
  ENABLE_CRASH_REPORTING: parseBoolean(Config.ENABLE_CRASH_REPORTING),
  USE_BACKEND_ANALYSIS: parseBoolean(Config.USE_BACKEND_ANALYSIS || 'false'),
};

// Validate configuration on import
validateConfig();

// Export individual config sections for convenience
export const apiConfig = {
  baseUrl: appConfig.API_BASE_URL,
  apiKey: appConfig.API_KEY,
};

export const geminiConfig = {
  apiKey: appConfig.GEMINI_API_KEY,
  apiUrl: appConfig.GEMINI_API_URL,
};

export const appSettings = {
  environment: appConfig.APP_ENV,
  debugMode: appConfig.DEBUG_MODE,
};

export const featureFlags = {
  analytics: appConfig.ENABLE_ANALYTICS,
  crashReporting: appConfig.ENABLE_CRASH_REPORTING,
  useBackendAnalysis: appConfig.USE_BACKEND_ANALYSIS,
};

// Helper functions
export const isDevelopment = (): boolean => appConfig.APP_ENV === 'development';
export const isProduction = (): boolean => appConfig.APP_ENV === 'production';
export const isDebugMode = (): boolean => appConfig.DEBUG_MODE;
