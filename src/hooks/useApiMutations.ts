import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as apiClient from '../api/apiClient';
import type {
  CreateUserPayload,
  LogExercisePayload,
  LogFoodPayload,
} from '../types/api';

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => apiClient.createUser(payload),
    onSuccess: () => {
      // Invalidate and refetch relevant queries after a user is created
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useLogExerciseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LogExercisePayload) => apiClient.logExercise(payload),
    onSuccess: (data) => {
      // Invalidate and refetch exercise logs for the user
      queryClient.invalidateQueries({
        queryKey: ['exerciseLogs', data.userKey],
      });
    },
  });
};

export const useLogFoodMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LogFoodPayload) => apiClient.logFood(payload),
    onSuccess: (data) => {
      // Invalidate and refetch food logs for the user
      queryClient.invalidateQueries({ queryKey: ['foodLogs', data.userKey] });
    },
  });
};
