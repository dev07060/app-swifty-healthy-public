import { create } from 'zustand';
import type { GeminiExerciseResponse, GeminiFoodResponse } from '../types';

interface AnalysisNavigationData {
  imageUri: string;
  analysisResult: GeminiFoodResponse | GeminiExerciseResponse;
  entryType: 'food' | 'exercise';
}

interface AnalysisNavigationStore {
  navigationData: AnalysisNavigationData | null;
  setNavigationData: (data: AnalysisNavigationData) => void;
  clearNavigationData: () => void;
}

export const useAnalysisNavigationStore = create<AnalysisNavigationStore>(
  (set, _) => ({
    navigationData: null,
    setNavigationData: (data) => set({ navigationData: data }),
    clearNavigationData: () => set({ navigationData: null }),
  }),
);
