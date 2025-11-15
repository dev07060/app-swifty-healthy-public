import { apiConfig } from '../config';
import type {
  CreateUserPayload,
  CreateUserResponse,
  LogExercisePayload,
  LogExerciseResponse,
  LogFoodPayload,
  LogFoodResponse,
} from '../types/api';

const post = async <T, P>(endpoint: string, payload: P): Promise<T> => {
  const bodyString = JSON.stringify(payload);
  console.log(`🚀 POST ${endpoint}`);
  console.log('🚀 Request body:', bodyString);
  
  const response = await fetch(`${apiConfig.baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: bodyString,
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ API Error:', error);
    throw new Error(error.detail || 'API request failed');
  }

  const result = await response.json();
  console.log('✅ API Response:', JSON.stringify(result, null, 2));
  return result;
};

export const createUser = (payload: CreateUserPayload) => {
  return post<CreateUserResponse, CreateUserPayload>('/api/users', payload);
};

export const logExercise = (payload: LogExercisePayload) => {
  return post<LogExerciseResponse, LogExercisePayload>(
    '/api/log/exercise',
    payload,
  );
};

export const logFood = (payload: LogFoodPayload) => {
  console.log('🌐 API Client - logFood payload:', JSON.stringify(payload, null, 2));
  console.log('🌐 API Client - ingredients:', payload.ingredients);
  return post<LogFoodResponse, LogFoodPayload>('/api/log/food', payload);
};
