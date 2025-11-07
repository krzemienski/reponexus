import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth/authService';
import { biometricService } from '@/services/auth/biometricService';
import { tokenManager } from '@/services/auth/tokenManager';
import { useAuthStore } from '@/stores/authStore';
import * as AuthSession from 'expo-auth-session';

// Mock dependencies
jest.mock('@/services/auth/authService');
jest.mock('@/services/auth/biometricService');
jest.mock('@/services/auth/tokenManager');
jest.mock('@/stores/authStore');

// Mock AppState
jest.mock('react-native/Libraries/AppState/AppState', () => ({
  addEventListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
}));

describe('useAuth', () => {
  const mockUser = {
    id: '1',
    githubId: '12345',
    login: 'testuser',
    name: 'Test User',
    email: 'test@example.com',
    avatarUrl: 'https://example.com/avatar.jpg',
    publicRepos: 10,
    publicGists: 5,
    followers: 100,
    following: 50,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const mockAuthStore = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    setUser: jest.fn(),
    setAuthenticated: jest.fn(),
    setLoading: jest.fn(),
    setError: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector ? selector(mockAuthStore) : mockAuthStore
    );
  });

  describe('initializeAuth', () => {
    it('should initialize auth when tokens exist and are valid', async () => {
      (tokenManager.hasTokens as jest.Mock).mockResolvedValue(true);
      (authService.checkAuth as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
      });

      expect(tokenManager.hasTokens).toHaveBeenCalled();
      expect(authService.checkAuth).toHaveBeenCalled();
    });

    it('should not authenticate when no tokens exist', async () => {
      (tokenManager.hasTokens as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
      });

      expect(authService.checkAuth).not.toHaveBeenCalled();
    });

    it('should logout when token validation fails', async () => {
      (tokenManager.hasTokens as jest.Mock).mockResolvedValue(true);
      (authService.checkAuth as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(tokenManager.clearTokens).toHaveBeenCalled();
        expect(mockAuthStore.logout).toHaveBeenCalled();
      });
    });
  });

  describe('login', () => {
    it('should successfully login with GitHub OAuth', async () => {
      const mockResult: AuthSession.AuthSessionResult = {
        type: 'success',
        params: { code: 'test_code', state: 'test_state' },
        authentication: null,
        url: '',
        errorCode: null,
      };

      const mockAuthResponse = {
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn: 3600,
        user: mockUser,
      };

      (authService.initiateLogin as jest.Mock).mockResolvedValue(mockResult);
      (authService.handleCallback as jest.Mock).mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuth());

      let loginSuccess = false;
      await act(async () => {
        loginSuccess = await result.current.login();
      });

      expect(loginSuccess).toBe(true);
      expect(authService.initiateLogin).toHaveBeenCalled();
      expect(authService.handleCallback).toHaveBeenCalledWith(mockResult);
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
    });

    it('should handle login failure', async () => {
      (authService.initiateLogin as jest.Mock).mockRejectedValue(
        new Error('Login failed')
      );

      const { result } = renderHook(() => useAuth());

      let loginSuccess = true;
      await act(async () => {
        loginSuccess = await result.current.login();
      });

      expect(loginSuccess).toBe(false);
      expect(mockAuthStore.setError).toHaveBeenCalled();
    });

    it('should handle callback returning null', async () => {
      const mockResult: AuthSession.AuthSessionResult = {
        type: 'success',
        params: { code: 'test_code', state: 'test_state' },
        authentication: null,
        url: '',
        errorCode: null,
      };

      (authService.initiateLogin as jest.Mock).mockResolvedValue(mockResult);
      (authService.handleCallback as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useAuth());

      let loginSuccess = true;
      await act(async () => {
        loginSuccess = await result.current.login();
      });

      expect(loginSuccess).toBe(false);
      expect(mockAuthStore.setError).toHaveBeenCalledWith('Login failed');
    });
  });

  describe('loginWithBiometric', () => {
    it('should successfully login with biometric', async () => {
      (biometricService.isBiometricEnabled as jest.Mock).mockResolvedValue(true);
      (biometricService.authenticate as jest.Mock).mockResolvedValue({
        success: true,
      });
      (authService.checkAuth as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useAuth());

      let loginSuccess = false;
      await act(async () => {
        loginSuccess = await result.current.loginWithBiometric();
      });

      expect(loginSuccess).toBe(true);
      expect(biometricService.authenticate).toHaveBeenCalled();
      expect(authService.checkAuth).toHaveBeenCalled();
    });

    it('should fail when biometric is not enabled', async () => {
      (biometricService.isBiometricEnabled as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useAuth());

      let loginSuccess = true;
      await act(async () => {
        loginSuccess = await result.current.loginWithBiometric();
      });

      expect(loginSuccess).toBe(false);
      expect(mockAuthStore.setError).toHaveBeenCalledWith(
        'Biometric authentication is not enabled'
      );
    });

    it('should fail when biometric authentication fails', async () => {
      (biometricService.isBiometricEnabled as jest.Mock).mockResolvedValue(true);
      (biometricService.authenticate as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Authentication failed',
      });

      const { result } = renderHook(() => useAuth());

      let loginSuccess = true;
      await act(async () => {
        loginSuccess = await result.current.loginWithBiometric();
      });

      expect(loginSuccess).toBe(false);
      expect(mockAuthStore.setError).toHaveBeenCalledWith('Authentication failed');
    });
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(authService.logout).toHaveBeenCalled();
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
    });

    it('should handle logout error', async () => {
      (authService.logout as jest.Mock).mockRejectedValue(
        new Error('Logout failed')
      );

      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.logout();
        })
      ).rejects.toThrow('Logout failed');

      expect(mockAuthStore.setError).toHaveBeenCalledWith('Failed to logout');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      (authService.refreshToken as jest.Mock).mockResolvedValue('new_token');

      const { result } = renderHook(() => useAuth());

      let refreshSuccess = false;
      await act(async () => {
        refreshSuccess = await result.current.refreshToken();
      });

      expect(refreshSuccess).toBe(true);
      expect(authService.refreshToken).toHaveBeenCalled();
    });

    it('should logout on refresh failure', async () => {
      (authService.refreshToken as jest.Mock).mockResolvedValue(null);
      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());

      let refreshSuccess = true;
      await act(async () => {
        refreshSuccess = await result.current.refreshToken();
      });

      expect(refreshSuccess).toBe(false);
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('enableBiometric', () => {
    it('should successfully enable biometric', async () => {
      (biometricService.enableBiometric as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useAuth());

      let success = false;
      await act(async () => {
        success = await result.current.enableBiometric();
      });

      expect(success).toBe(true);
      expect(biometricService.enableBiometric).toHaveBeenCalled();
    });

    it('should handle enable biometric failure', async () => {
      (biometricService.enableBiometric as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useAuth());

      let success = true;
      await act(async () => {
        success = await result.current.enableBiometric();
      });

      expect(success).toBe(false);
      expect(mockAuthStore.setError).toHaveBeenCalledWith(
        'Failed to enable biometric authentication'
      );
    });
  });

  describe('disableBiometric', () => {
    it('should successfully disable biometric', async () => {
      (biometricService.disableBiometric as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.disableBiometric();
      });

      expect(biometricService.disableBiometric).toHaveBeenCalled();
    });
  });

  describe('isBiometricAvailable', () => {
    it('should check if biometric is available', async () => {
      (biometricService.isAvailable as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useAuth());

      let isAvailable = false;
      await act(async () => {
        isAvailable = await result.current.isBiometricAvailable();
      });

      expect(isAvailable).toBe(true);
      expect(biometricService.isAvailable).toHaveBeenCalled();
    });
  });

  describe('isBiometricEnabled', () => {
    it('should check if biometric is enabled', async () => {
      (biometricService.isBiometricEnabled as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useAuth());

      let isEnabled = false;
      await act(async () => {
        isEnabled = await result.current.isBiometricEnabled();
      });

      expect(isEnabled).toBe(true);
      expect(biometricService.isBiometricEnabled).toHaveBeenCalled();
    });
  });
});
