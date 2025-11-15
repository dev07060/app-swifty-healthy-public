import { useHealthTrackerStore } from '../healthTracker';
// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));
describe('HealthTrackerStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useHealthTrackerStore.setState({
      entries: [],
      isLoading: false,
      error: null,
    });
  });
  describe('addExerciseEntry', () => {
    it('should add an exercise entry with generated id and createdAt', () => {
      const store = useHealthTrackerStore.getState();
      const exerciseData = {
        type: 'exercise',
        exerciseType: 'Running',
        duration: '00:30:00',
        calories: 300,
        date: '2024-01-15',
        timestamp: '2024-01-15T10:00:00.000Z',
      };
      store.addExerciseEntry(exerciseData);
      const state = useHealthTrackerStore.getState();
      expect(state.entries).toHaveLength(1);
      expect(state.entries[0]).toMatchObject(exerciseData);
      expect(state.entries[0]?.id).toBeDefined();
      expect(state.entries[0]?.createdAt).toBeDefined();
      expect(state.error).toBeNull();
    });
  });
  describe('addFoodEntry', () => {
    it('should add a food entry with generated id and createdAt', () => {
      const store = useHealthTrackerStore.getState();
      const foodData = {
        type: 'food',
        isHealthy: true,
        mainIngredients: ['chicken', 'vegetables'],
        estimatedCalories: 450,
        mealType: 'lunch',
        date: '2024-01-15',
        timestamp: '2024-01-15T12:00:00.000Z',
      };
      store.addFoodEntry(foodData);
      const state = useHealthTrackerStore.getState();
      expect(state.entries).toHaveLength(1);
      expect(state.entries[0]).toMatchObject(foodData);
      expect(state.entries[0]?.id).toBeDefined();
      expect(state.entries[0]?.createdAt).toBeDefined();
      expect(state.error).toBeNull();
    });
  });
  describe('removeEntry', () => {
    it('should remove an entry by id', () => {
      const store = useHealthTrackerStore.getState();
      // Add an entry first
      const exerciseData = {
        type: 'exercise',
        exerciseType: 'Running',
        duration: '00:30:00',
        calories: 300,
        date: '2024-01-15',
        timestamp: '2024-01-15T10:00:00.000Z',
      };
      store.addExerciseEntry(exerciseData);
      const entryId = useHealthTrackerStore.getState().entries[0]?.id;
      // Remove the entry
      if (entryId) {
        store.removeEntry(entryId);
      }
      const state = useHealthTrackerStore.getState();
      expect(state.entries).toHaveLength(0);
      expect(state.error).toBeNull();
    });
  });
  describe('getEntriesByDateRange', () => {
    it('should return entries within the specified date range', () => {
      const store = useHealthTrackerStore.getState();
      // Add entries with different dates
      store.addExerciseEntry({
        type: 'exercise',
        exerciseType: 'Running',
        duration: '00:30:00',
        calories: 300,
        date: '2024-01-15',
        timestamp: '2024-01-15T10:00:00.000Z',
      });
      store.addFoodEntry({
        type: 'food',
        isHealthy: true,
        mainIngredients: ['salad'],
        estimatedCalories: 200,
        mealType: 'lunch',
        date: '2024-01-16',
        timestamp: '2024-01-16T12:00:00.000Z',
      });
      store.addExerciseEntry({
        type: 'exercise',
        exerciseType: 'Cycling',
        duration: '01:00:00',
        calories: 500,
        date: '2024-01-20',
        timestamp: '2024-01-20T10:00:00.000Z',
      });
      const entriesInRange = store.getEntriesByDateRange(
        '2024-01-15',
        '2024-01-16',
      );
      expect(entriesInRange).toHaveLength(2);
      expect(entriesInRange[0]?.date).toBe('2024-01-15');
      expect(entriesInRange[1]?.date).toBe('2024-01-16');
    });
  });
  describe('getWeeklyStats', () => {
    it('should calculate weekly statistics correctly', () => {
      const store = useHealthTrackerStore.getState();
      // Add entries for a week (Monday to Sunday)
      store.addExerciseEntry({
        type: 'exercise',
        exerciseType: 'Running',
        duration: '00:30:00',
        calories: 300,
        date: '2024-01-15', // Monday
        timestamp: '2024-01-15T10:00:00.000Z',
      });
      store.addFoodEntry({
        type: 'food',
        isHealthy: true,
        mainIngredients: ['salad'],
        estimatedCalories: 200,
        mealType: 'lunch',
        date: '2024-01-16', // Tuesday
        timestamp: '2024-01-16T12:00:00.000Z',
      });
      store.addFoodEntry({
        type: 'food',
        isHealthy: false,
        mainIngredients: ['pizza'],
        estimatedCalories: 800,
        mealType: 'dinner',
        date: '2024-01-17', // Wednesday
        timestamp: '2024-01-17T19:00:00.000Z',
      });
      const weeklyStats = store.getWeeklyStats('2024-01-15');
      expect(weeklyStats.weekStart).toBe('2024-01-15');
      expect(weeklyStats.weekEnd).toBe('2024-01-21');
      expect(weeklyStats.exerciseCount).toBe(1);
      expect(weeklyStats.foodCount).toBe(2);
      expect(weeklyStats.totalCaloriesBurned).toBe(300);
      expect(weeklyStats.totalCaloriesConsumed).toBe(1000);
      expect(weeklyStats.healthyFoodPercentage).toBe(50);
    });
  });
  describe('error handling', () => {
    it('should clear error when clearError is called', () => {
      const store = useHealthTrackerStore.getState();
      // Set an error state manually
      useHealthTrackerStore.setState({
        error: {
          type: 'validation',
          message: 'Test error',
        },
      });
      store.clearError();
      const state = useHealthTrackerStore.getState();
      expect(state.error).toBeNull();
    });
  });
  describe('loading state', () => {
    it('should set loading state correctly', () => {
      const store = useHealthTrackerStore.getState();
      store.setLoading(true);
      expect(useHealthTrackerStore.getState().isLoading).toBe(true);
      store.setLoading(false);
      expect(useHealthTrackerStore.getState().isLoading).toBe(false);
    });
  });
});
