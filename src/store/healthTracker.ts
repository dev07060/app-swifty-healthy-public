import { create } from 'zustand';
import type {
  HealthTrackerState,
  AuthenticationEntry,
  ExerciseEntry,
  FoodEntry,
  WeeklyStats,
} from '../types';
import {
  generateEntryId,
  getCurrentTimestamp,
} from '../utils/dataTransformers';
import calculateWeeklyStats from '../utils/dataTransformers';
import { apiService } from '../services/api';

type HealthTrackerStore = HealthTrackerState & {
  addExerciseEntry: (entry: Omit<ExerciseEntry, 'id' | 'createdAt'>) => void;
  addFoodEntry: (entry: Omit<FoodEntry, 'id' | 'createdAt'>) => void;
  removeEntry: (id: string) => void;
  getEntriesByDateRange: (
    startDate: string,
    endDate: string,
  ) => AuthenticationEntry[];
  getWeeklyStats: (weekStart: string) => WeeklyStats;
  setLoading: (isLoading: boolean) => void;
  setError: (error: { type: string; message: string } | null) => void;
  clearError: () => void;
  fetchTodayExerciseLogs: (userKey: string) => Promise<void>;
  fetchTodayFoodLogs: (userKey: string) => Promise<void>;
};

export const useHealthTrackerStore = create<HealthTrackerStore>()((set, get) => ({
      entries: [],
      isLoading: false,
      error: null,

      addExerciseEntry: (entry) => {
        const newEntry: ExerciseEntry = {
          ...entry,
          id: generateEntryId(),
          createdAt: getCurrentTimestamp(),
        };
        set((state) => ({
          entries: [newEntry, ...state.entries],
          error: null,
        }));
      },

      addFoodEntry: (entry) => {
        const newEntry: FoodEntry = {
          ...entry,
          id: generateEntryId(),
          createdAt: getCurrentTimestamp(),
        };
        set((state) => ({
          entries: [newEntry, ...state.entries],
          error: null,
        }));
      },

      removeEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
          error: null,
        }));
      },

      getEntriesByDateRange: (startDate, endDate) => {
        const { entries } = get();
        return entries.filter(
          (entry) => entry.date >= startDate && entry.date <= endDate,
        );
      },

      getWeeklyStats: (weekStart) => {
        const { entries } = get();
        return calculateWeeklyStats(entries, weekStart);
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setError: (error) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      fetchTodayExerciseLogs: async (userKey) => {
        set({ isLoading: true, error: null });
        try {
          const exerciseLogs = await apiService.getTodayExerciseLogs(userKey);
          set((state) => {
            const existingIds = new Set(state.entries.map((e) => e.id));
            const newEntries = exerciseLogs.filter((log) => !existingIds.has(log.id));
            return {
              entries: [...newEntries, ...state.entries],
              isLoading: false,
            };
          });
        } catch (error) {
          set({
            isLoading: false,
            error: {
              type: 'FETCH_ERROR',
              message: error instanceof Error ? error.message : 'Failed to fetch exercise logs',
            },
          });
        }
      },

      fetchTodayFoodLogs: async (userKey) => {
        set({ isLoading: true, error: null });
        try {
          const foodLogs = await apiService.getTodayFoodLogs(userKey);
          set((state) => {
            const existingIds = new Set(state.entries.map((e) => e.id));
            const newEntries = foodLogs.filter((log) => !existingIds.has(log.id));
            return {
              entries: [...newEntries, ...state.entries],
              isLoading: false,
            };
          });
        } catch (error) {
          set({
            isLoading: false,
            error: {
              type: 'FETCH_ERROR',
              message: error instanceof Error ? error.message : 'Failed to fetch food logs',
            },
          });
        }
      },
    }));
