import { featureFlags } from '../config';
import { geminiAPIClient } from './GeminiAPIClient';
import { backendAPIClient } from './BackendAPIClient';
import type { GeminiExerciseResponse, GeminiFoodResponse } from '../types';

// Common interface for both clients
export interface IAnalysisService {
  analyzeExerciseScreenshot(imageUri: string): Promise<GeminiExerciseResponse>;
  analyzeFoodPhoto(imageUri: string): Promise<GeminiFoodResponse>;
}

// Factory to get the appropriate service based on feature flag
export const getAnalysisService = (): IAnalysisService => {
  console.log('🔌 Current Analysis Service Mode:', featureFlags.useBackendAnalysis ? 'BACKEND (FastAPI)' : 'CLIENT (Direct Gemini)');
  
  if (featureFlags.useBackendAnalysis) {
    return backendAPIClient;
  }
  return geminiAPIClient;
};
