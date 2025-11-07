import { create } from 'zustand';
import { User } from '@/types/models';
import { AuthState } from '@/types/auth';

interface AuthStore extends AuthState {
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  reset: () => void;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>((set) => ({
  ...initialState,

  setUser: (user) => set({ user }),

  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  logout: () => set({ user: null, isAuthenticated: false, error: null }),

  reset: () => set(initialState),
}));

// Selectors
export const selectUser = (state: AuthStore) => state.user;
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated;
export const selectIsLoading = (state: AuthStore) => state.isLoading;
export const selectError = (state: AuthStore) => state.error;
