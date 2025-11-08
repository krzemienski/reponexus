import { useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { tokenManager } from '@/services/auth/tokenManager';
import apiClient from '@/services/api/client';
import { API_ENDPOINTS } from '@/utils/constants';
import { AuthResponse } from '@/types/auth';
import { User } from '@/types/models';

/**
 * Token Authentication Hook
 * Provides token-based authentication for development/testing
 */
export function useTokenAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser, setAuthenticated } = useAuthStore();

  /**
   * Login with GitHub Personal Access Token
   */
  const loginWithToken = useCallback(
    async (githubToken: string): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        if (!githubToken.trim()) {
          throw new Error('GitHub token is required');
        }

        // Call token auth endpoint
        const response = await apiClient.post<AuthResponse>(
          API_ENDPOINTS.TOKEN_AUTH,
          { githubToken }
        );

        const { accessToken, refreshToken, expiresIn, user } = response.data;

        // Save tokens
        await tokenManager.saveTokens({
          accessToken,
          refreshToken,
          expiresAt: Date.now() + expiresIn * 1000,
        });

        // Update auth store
        setUser(user);
        setAuthenticated(true);

        return true;
      } catch (error: any) {
        console.error('[useTokenAuth] Token login failed:', error);
        const errorMessage =
          error?.message || 'Failed to login with token';
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setUser, setAuthenticated]
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loginWithToken,
    isLoading,
    error,
    clearError,
  };
}

/**
 * Dev Settings Hook
 * Provides utilities for development settings
 */
export function useDevSettings() {
  const [tokenInfo, setTokenInfo] = useState<{
    token: string | null;
    expiresAt: number | null;
    timeRemaining: string | null;
  }>({
    token: null,
    expiresAt: null,
    timeRemaining: null,
  });

  /**
   * Get current JWT token info
   */
  const getTokenInfo = useCallback(async () => {
    try {
      const accessToken = await tokenManager.getAccessToken();
      const expiresAt = await tokenManager.getTokenExpiresAt();

      let timeRemaining = null;
      if (expiresAt) {
        const remaining = expiresAt - Date.now();
        if (remaining > 0) {
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          timeRemaining = `${minutes}m ${seconds}s`;
        } else {
          timeRemaining = 'Expired';
        }
      }

      setTokenInfo({
        token: accessToken,
        expiresAt,
        timeRemaining,
      });
    } catch (error) {
      console.error('[useDevSettings] Failed to get token info:', error);
      setTokenInfo({
        token: null,
        expiresAt: null,
        timeRemaining: null,
      });
    }
  }, []);

  /**
   * Clear all auth data
   */
  const clearAuthData = useCallback(async () => {
    try {
      await tokenManager.clearTokens();
      useAuthStore.getState().logout();
      setTokenInfo({
        token: null,
        expiresAt: null,
        timeRemaining: null,
      });
    } catch (error) {
      console.error('[useDevSettings] Failed to clear auth data:', error);
      throw error;
    }
  }, []);

  /**
   * Get current user
   */
  const getCurrentUser = useCallback(async (): Promise<User | null> => {
    try {
      const response = await apiClient.get<User>(API_ENDPOINTS.ME);
      return response.data;
    } catch (error) {
      console.error('[useDevSettings] Failed to get current user:', error);
      return null;
    }
  }, []);

  return {
    tokenInfo,
    getTokenInfo,
    clearAuthData,
    getCurrentUser,
  };
}
