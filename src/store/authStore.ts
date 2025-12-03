/**
 * Authentication state store using Zustand
 * Manages user authentication state and user data
 */

import { create } from 'zustand';
import type { TossUserData } from '../types/tossAuth';

interface AuthState {
  // State
  isAuthenticated: boolean;
  user: TossUserData | null;
  txId: string | null;
  authStatus: 'idle' | 'requesting' | 'waiting' | 'polling' | 'success' | 'error';
  error: string | null;

  // Actions
  setAuthenticating: (txId: string) => void;
  setWaitingForUser: () => void;
  setPolling: () => void;
  setUser: (userData: TossUserData, txId: string) => void;
  setError: (error: string) => void;
  clearAuth: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  isAuthenticated: false,
  user: null,
  txId: null,
  authStatus: 'idle',
  error: null,

  // Actions
  setAuthenticating: (txId: string) => {
    console.log('📝 Auth state: requesting (txId:', txId, ')');
    set({
      txId,
      authStatus: 'requesting',
      error: null,
    });
  },

  setWaitingForUser: () => {
    console.log('📝 Auth state: waiting for user');
    set({
      authStatus: 'waiting',
    });
  },

  setPolling: () => {
    console.log('📝 Auth state: polling');
    set({
      authStatus: 'polling',
    });
  },

  setUser: (userData: TossUserData, txId: string) => {
    console.log('📝 Auth state: success');
    console.log('👤 User:', userData.name, userData.gender, userData.ageGroup);
    set({
      isAuthenticated: true,
      user: userData,
      txId,
      authStatus: 'success',
      error: null,
    });
  },

  setError: (error: string) => {
    console.error('📝 Auth state: error -', error);
    set({
      authStatus: 'error',
      error,
    });
  },

  clearAuth: () => {
    console.log('📝 Clearing auth state');
    set({
      isAuthenticated: false,
      user: null,
      txId: null,
      authStatus: 'idle',
      error: null,
    });
  },

  reset: () => {
    console.log('📝 Resetting auth state');
    set({
      isAuthenticated: false,
      user: null,
      txId: null,
      authStatus: 'idle',
      error: null,
    });
  },
}));
