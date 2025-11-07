import { useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth/authService';
import { biometricService } from '@/services/auth/biometricService';
import { tokenManager } from '@/services/auth/tokenManager';
import { TIMING } from '@/utils/constants';
import * as AuthSession from 'expo-auth-session';

/**
 * Authentication Hook
 * Provides authentication functionality and state management
 */
export function useAuth() {
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Get auth state from store
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    setUser,
    setAuthenticated,
    setLoading,
    setError,
    logout: storeLogout,
  } = useAuthStore();

  /**
   * Clear session timeout
   */
  const clearSessionTimeout = useCallback(() => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
  }, []);

  /**
   * Start session timeout timer
   */
  const startSessionTimeout = useCallback(() => {
    clearSessionTimeout();

    sessionTimeoutRef.current = setTimeout(async () => {
      console.log('[useAuth] Session timeout - logging out');
      await handleLogout();
    }, TIMING.sessionTimeout);
  }, [clearSessionTimeout]);

  /**
   * Reset session timeout (called on user activity)
   */
  const resetSessionTimeout = useCallback(() => {
    lastActivityRef.current = Date.now();
    startSessionTimeout();
  }, [startSessionTimeout]);

  /**
   * Initialize authentication on app launch
   */
  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if tokens exist
      const hasTokens = await tokenManager.hasTokens();

      if (!hasTokens) {
        setLoading(false);
        return;
      }

      // Check authentication status
      const isAuth = await authService.checkAuth();

      if (isAuth) {
        // Start session timeout
        startSessionTimeout();
      } else {
        // Clear invalid tokens
        await tokenManager.clearTokens();
        storeLogout();
      }
    } catch (error) {
      console.error('[useAuth] Failed to initialize auth:', error);
      setError('Failed to initialize authentication');
      await tokenManager.clearTokens();
      storeLogout();
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, storeLogout, startSessionTimeout]);

  /**
   * Login with GitHub OAuth
   */
  const login = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Initiate OAuth flow
      const result = await authService.initiateLogin();

      // Handle callback
      const authResponse = await authService.handleCallback(result);

      if (!authResponse) {
        setError('Login failed');
        return false;
      }

      // Start session timeout
      startSessionTimeout();

      return true;
    } catch (error: any) {
      console.error('[useAuth] Login failed:', error);
      const errorMessage =
        error?.message || 'An error occurred during login';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, startSessionTimeout]);

  /**
   * Handle OAuth callback
   */
  const handleCallback = useCallback(
    async (result: AuthSession.AuthSessionResult): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const authResponse = await authService.handleCallback(result);

        if (!authResponse) {
          setError('Authentication failed');
          return false;
        }

        // Start session timeout
        startSessionTimeout();

        return true;
      } catch (error: any) {
        console.error('[useAuth] Callback handling failed:', error);
        const errorMessage =
          error?.message || 'An error occurred during authentication';
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, startSessionTimeout]
  );

  /**
   * Login with biometric authentication
   */
  const loginWithBiometric = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Check if biometric is enabled
      const isBiometricEnabled = await biometricService.isBiometricEnabled();

      if (!isBiometricEnabled) {
        setError('Biometric authentication is not enabled');
        return false;
      }

      // Authenticate with biometrics
      const result = await biometricService.authenticate();

      if (!result.success) {
        setError(result.error || 'Biometric authentication failed');
        return false;
      }

      // Check auth status (tokens should already exist)
      const isAuth = await authService.checkAuth();

      if (!isAuth) {
        setError('Authentication failed');
        return false;
      }

      // Start session timeout
      startSessionTimeout();

      return true;
    } catch (error: any) {
      console.error('[useAuth] Biometric login failed:', error);
      setError(error?.message || 'Biometric authentication error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, startSessionTimeout]);

  /**
   * Logout user
   */
  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Clear session timeout
      clearSessionTimeout();

      // Logout
      await authService.logout();
    } catch (error) {
      console.error('[useAuth] Logout failed:', error);
      setError('Failed to logout');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, clearSessionTimeout]);

  /**
   * Refresh access token
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const newToken = await authService.refreshToken();

      if (!newToken) {
        // Refresh failed - logout user
        await handleLogout();
        return false;
      }

      // Reset session timeout
      resetSessionTimeout();

      return true;
    } catch (error) {
      console.error('[useAuth] Token refresh failed:', error);
      await handleLogout();
      return false;
    }
  }, [handleLogout, resetSessionTimeout]);

  /**
   * Enable biometric authentication
   */
  const enableBiometric = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const success = await biometricService.enableBiometric();

      if (!success) {
        setError('Failed to enable biometric authentication');
      }

      return success;
    } catch (error: any) {
      console.error('[useAuth] Failed to enable biometric:', error);
      setError(error?.message || 'Failed to enable biometric authentication');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  /**
   * Disable biometric authentication
   */
  const disableBiometric = useCallback(async (): Promise<void> => {
    try {
      await biometricService.disableBiometric();
    } catch (error) {
      console.error('[useAuth] Failed to disable biometric:', error);
      throw error;
    }
  }, []);

  /**
   * Check if biometric is available
   */
  const isBiometricAvailable = useCallback(async (): Promise<boolean> => {
    return await biometricService.isAvailable();
  }, []);

  /**
   * Check if biometric is enabled
   */
  const isBiometricEnabled = useCallback(async (): Promise<boolean> => {
    return await biometricService.isBiometricEnabled();
  }, []);

  /**
   * Handle app state changes
   */
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isAuthenticated) {
        // App came to foreground
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;

        // If inactive for more than session timeout, logout
        if (timeSinceLastActivity >= TIMING.sessionTimeout) {
          console.log('[useAuth] Session expired during background');
          await handleLogout();
          return;
        }

        // Check if token needs refresh
        const isExpired = await tokenManager.isTokenExpired();
        if (isExpired) {
          await refreshToken();
        }

        // Reset session timeout
        resetSessionTimeout();
      } else if (nextAppState === 'background') {
        // App went to background
        clearSessionTimeout();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [
    isAuthenticated,
    handleLogout,
    refreshToken,
    resetSessionTimeout,
    clearSessionTimeout,
  ]);

  /**
   * Initialize auth on mount
   */
  useEffect(() => {
    initializeAuth();

    return () => {
      clearSessionTimeout();
    };
  }, [initializeAuth, clearSessionTimeout]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    login,
    handleCallback,
    loginWithBiometric,
    logout: handleLogout,
    refreshToken,
    initializeAuth,

    // Biometric
    enableBiometric,
    disableBiometric,
    isBiometricAvailable,
    isBiometricEnabled,

    // Session management
    resetSessionTimeout,
  };
}

export default useAuth;
