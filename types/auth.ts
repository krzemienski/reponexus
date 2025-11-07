import { User } from './models';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface LoginRequest {
  code: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
