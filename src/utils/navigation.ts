// Granite-specific navigation utilities for scheme-based routing

import { useCallback } from 'react';
import { Linking } from 'react-native';

// Health Tracker App Routes
export const HEALTH_TRACKER_ROUTES = {
  MAIN: 'intoss://health-tracker-app',
  EXERCISE_UPLOAD: 'intoss://health-tracker-app/exercise-upload',
  FOOD_UPLOAD: 'intoss://health-tracker-app/food-upload',
  REPORTS: 'intoss://health-tracker-app/reports',
} as const;

/**
 * Navigate to main upload screen
 */
export const navigateToMain = (): Promise<boolean> => {
  return Linking.openURL(HEALTH_TRACKER_ROUTES.MAIN);
};

/**
 * Navigate to exercise upload screen
 */
export const navigateToExerciseUpload = (): Promise<boolean> => {
  return Linking.openURL(HEALTH_TRACKER_ROUTES.EXERCISE_UPLOAD);
};

/**
 * Navigate to food upload screen
 */
export const navigateToFoodUpload = (): Promise<boolean> => {
  return Linking.openURL(HEALTH_TRACKER_ROUTES.FOOD_UPLOAD);
};

/**
 * Navigate to reports screen
 */
export const navigateToReports = (): Promise<boolean> => {
  return Linking.openURL(HEALTH_TRACKER_ROUTES.REPORTS);
};

/**
 * Check if a URL belongs to the health tracker app
 */
export const isHealthTrackerURL = (url: string): boolean => {
  return url.startsWith('intoss://health-tracker-app');
};

/**
 * Parse route from URL
 */
export const parseRoute = (url: string): string | null => {
  if (!isHealthTrackerURL(url)) {
    return null;
  }

  const route = url.replace('intoss://health-tracker-app', '');
  return route || '/';
};

/**
 * Handle deep link navigation
 */
export const handleDeepLink = (url: string): boolean => {
  if (!isHealthTrackerURL(url)) {
    return false;
  }

  const route = parseRoute(url);

  switch (route) {
    case '/':
      // Already on main screen
      return true;
    case '/exercise-upload':
      // Handle exercise upload navigation
      return true;
    case '/food-upload':
      // Handle food upload navigation
      return true;
    case '/reports':
      // Handle reports navigation
      return true;
    default:
      return false;
  }
};

// Hook for handling deep links in components
export const useGraniteNavigation = () => {
  return {
    navigateToMain: useCallback(navigateToMain, []),
    navigateToExerciseUpload: useCallback(navigateToExerciseUpload, []),
    navigateToFoodUpload: useCallback(navigateToFoodUpload, []),
    navigateToReports: useCallback(navigateToReports, []),
    isHealthTrackerURL: useCallback(isHealthTrackerURL, []),
    parseRoute: useCallback(parseRoute, []),
    handleDeepLink: useCallback(handleDeepLink, []),
  };
};
