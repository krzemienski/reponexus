import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth/authService';
import { biometricService } from '@/services/auth/biometricService';
import { tokenManager } from '@/services/auth/tokenManager';

// Mock the services
jest.mock('@/services/auth/authService');
jest.mock('@/services/auth/biometricService');
jest.mock('@/services/auth/tokenManager');
jest.mock('@/stores/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    setUser: jest.fn(),
    setAuthenticated: jest.fn(),
    setLoading: jest.fn(),
    setError: jest.fn(),
    logout: jest.fn(),
  })),
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with GitHub OAuth', async () => {
      const mockAuthResponse = {
        access_token: 'mock-token',
        user: { id: '1', login: 'testuser' },
      };

      (authService.initiateLogin as jest.Mock).mockResolvedValue({
        type: 'success',
        params: { code: 'mock-code' },
      });
      (authService.handleCallback as jest.Mock).mockResolvedValue(
        mockAuthResponse
      );

      const { result } = renderHook(() => useAuth());

      let loginResult: boolean = false;
      await act(async () => {
        loginResult = await result.current.login();
      });

      expect(loginResult).toBe(true);
      expect(authService.initiateLogin).toHaveBeenCalled();
      expect(authService.handleCallback).toHaveBeenCalled();
    });

    it('should handle login failure', async () => {
      (authService.initiateLogin as jest.Mock).mockRejectedValue(
        new Error('OAuth failed')
      );

      const { result } = renderHook(() => useAuth());

      let loginResult: boolean = false;
      await act(async () => {
        loginResult = await result.current.login();
      });

      expect(loginResult).toBe(false);
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      (authService.refreshToken as jest.Mock).mockResolvedValue('new-token');

      const { result } = renderHook(() => useAuth());

      let refreshResult: boolean = false;
      await act(async () => {
        refreshResult = await result.current.refreshToken();
      });

      expect(refreshResult).toBe(true);
      expect(authService.refreshToken).toHaveBeenCalled();
    });
  });

  describe('biometric authentication', () => {
    it('should successfully authenticate with biometrics', async () => {
      (biometricService.isBiometricEnabled as jest.Mock).mockResolvedValue(
        true
      );
      (biometricService.authenticate as jest.Mock).mockResolvedValue({
        success: true,
      });
      (authService.checkAuth as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useAuth());

      let biometricResult: boolean = false;
      await act(async () => {
        biometricResult = await result.current.loginWithBiometric();
      });

      expect(biometricResult).toBe(true);
      expect(biometricService.authenticate).toHaveBeenCalled();
    });

    it('should handle biometric authentication failure', async () => {
      (biometricService.isBiometricEnabled as jest.Mock).mockResolvedValue(
        true
      );
      (biometricService.authenticate as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Authentication failed',
      });

      const { result } = renderHook(() => useAuth());

      let biometricResult: boolean = false;
      await act(async () => {
        biometricResult = await result.current.loginWithBiometric();
      });

      expect(biometricResult).toBe(false);
    });
  });
});
