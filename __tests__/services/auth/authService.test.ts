import { authService } from '@/services/auth/authService';
import { tokenManager } from '@/services/auth/tokenManager';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/services/api/client';
import * as AuthSession from 'expo-auth-session';

// Mock dependencies
jest.mock('@/services/auth/tokenManager');
jest.mock('@/stores/authStore');
jest.mock('@/services/api/client');
jest.mock('expo-auth-session');
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openBrowserAsync: jest.fn(),
}));

describe('AuthService', () => {
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

  const mockAuthResponse = {
    accessToken: 'mock_access_token',
    refreshToken: 'mock_refresh_token',
    expiresIn: 3600,
    user: mockUser,
  };

  const mockAuthStore = {
    setUser: jest.fn(),
    setAuthenticated: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore.getState as jest.Mock).mockReturnValue(mockAuthStore);
  });

  describe('initiateLogin', () => {
    it('should successfully initiate OAuth login', async () => {
      const mockResult: AuthSession.AuthSessionResult = {
        type: 'success',
        params: { code: 'test_code', state: 'test_state' },
        authentication: null,
        url: '',
        errorCode: null,
      };

      const mockRequest = {
        promptAsync: jest.fn().mockResolvedValue(mockResult),
      };

      (AuthSession.AuthRequest as jest.Mock).mockImplementation(() => mockRequest);

      const result = await authService.initiateLogin();

      expect(result.type).toBe('success');
      expect(mockRequest.promptAsync).toHaveBeenCalled();
    });

    it('should handle login initiation error', async () => {
      const mockRequest = {
        promptAsync: jest.fn().mockRejectedValue(new Error('Network error')),
      };

      (AuthSession.AuthRequest as jest.Mock).mockImplementation(() => mockRequest);

      await expect(authService.initiateLogin()).rejects.toThrow(
        'Failed to initiate login'
      );
    });
  });

  describe('handleCallback', () => {
    it('should successfully handle OAuth callback', async () => {
      const mockResult: AuthSession.AuthSessionResult = {
        type: 'success',
        params: { code: 'test_code', state: 'test_state' },
        authentication: null,
        url: '',
        errorCode: null,
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockAuthResponse });
      (tokenManager.saveTokens as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.handleCallback(mockResult);

      expect(result).toEqual(mockAuthResponse);
      expect(tokenManager.saveTokens).toHaveBeenCalledWith({
        accessToken: mockAuthResponse.accessToken,
        refreshToken: mockAuthResponse.refreshToken,
        expiresAt: expect.any(Number),
      });
      expect(mockAuthStore.setUser).toHaveBeenCalledWith(mockUser);
      expect(mockAuthStore.setAuthenticated).toHaveBeenCalledWith(true);
    });

    it('should handle user cancellation', async () => {
      const mockResult: AuthSession.AuthSessionResult = {
        type: 'cancel',
        params: {},
        authentication: null,
        url: '',
        errorCode: null,
      };

      await expect(authService.handleCallback(mockResult)).rejects.toThrow(
        'Login cancelled by user'
      );
    });

    it('should handle OAuth error', async () => {
      const mockResult: AuthSession.AuthSessionResult = {
        type: 'error',
        params: {},
        authentication: null,
        url: '',
        errorCode: 'access_denied',
        error: { message: 'Access denied' },
      };

      await expect(authService.handleCallback(mockResult)).rejects.toThrow(
        'Access denied'
      );
    });

    it('should handle missing authorization code', async () => {
      const mockResult: AuthSession.AuthSessionResult = {
        type: 'success',
        params: {},
        authentication: null,
        url: '',
        errorCode: null,
      };

      await expect(authService.handleCallback(mockResult)).rejects.toThrow(
        'No authorization code received'
      );
    });
  });

  describe('exchangeCodeForToken', () => {
    it('should successfully exchange code for token', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockAuthResponse });

      const result = await authService.exchangeCodeForToken('test_code');

      expect(result).toEqual(mockAuthResponse);
      expect(apiClient.post).toHaveBeenCalledWith(expect.any(String), {
        code: 'test_code',
      });
    });

    it('should handle token exchange failure', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('API error'));

      await expect(authService.exchangeCodeForToken('test_code')).rejects.toThrow(
        'Failed to exchange code for token'
      );
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh access token', async () => {
      (tokenManager.getRefreshToken as jest.Mock).mockResolvedValue(
        'mock_refresh_token'
      );
      (apiClient.post as jest.Mock).mockResolvedValue({
        data: { accessToken: 'new_access_token', expiresIn: 3600 },
      });
      (tokenManager.saveTokens as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.refreshToken();

      expect(result).toBe('new_access_token');
      expect(tokenManager.saveTokens).toHaveBeenCalledWith({
        accessToken: 'new_access_token',
        refreshToken: 'mock_refresh_token',
        expiresAt: expect.any(Number),
      });
    });

    it('should handle missing refresh token', async () => {
      (tokenManager.getRefreshToken as jest.Mock).mockResolvedValue(null);

      const result = await authService.refreshToken();

      expect(result).toBeNull();
      expect(mockAuthStore.logout).toHaveBeenCalled();
    });

    it('should handle refresh failure', async () => {
      (tokenManager.getRefreshToken as jest.Mock).mockResolvedValue(
        'mock_refresh_token'
      );
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Refresh failed'));

      const result = await authService.refreshToken();

      expect(result).toBeNull();
      expect(mockAuthStore.logout).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should successfully get current user', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockUser });

      const result = await authService.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(apiClient.get).toHaveBeenCalled();
    });

    it('should handle get user failure', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('API error'));

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('checkAuth', () => {
    it('should return true for valid authentication', async () => {
      (tokenManager.getAccessToken as jest.Mock).mockResolvedValue('mock_token');
      (tokenManager.isTokenExpired as jest.Mock).mockResolvedValue(false);
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockUser });

      const result = await authService.checkAuth();

      expect(result).toBe(true);
      expect(mockAuthStore.setUser).toHaveBeenCalledWith(mockUser);
      expect(mockAuthStore.setAuthenticated).toHaveBeenCalledWith(true);
    });

    it('should refresh expired token', async () => {
      (tokenManager.getAccessToken as jest.Mock).mockResolvedValue('mock_token');
      (tokenManager.isTokenExpired as jest.Mock).mockResolvedValue(true);
      (tokenManager.getRefreshToken as jest.Mock).mockResolvedValue(
        'mock_refresh_token'
      );
      (apiClient.post as jest.Mock).mockResolvedValue({
        data: { accessToken: 'new_token', expiresIn: 3600 },
      });
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockUser });

      const result = await authService.checkAuth();

      expect(result).toBe(true);
    });

    it('should return false when no token exists', async () => {
      (tokenManager.getAccessToken as jest.Mock).mockResolvedValue(null);

      const result = await authService.checkAuth();

      expect(result).toBe(false);
    });

    it('should return false when user fetch fails', async () => {
      (tokenManager.getAccessToken as jest.Mock).mockResolvedValue('mock_token');
      (tokenManager.isTokenExpired as jest.Mock).mockResolvedValue(false);
      (apiClient.get as jest.Mock).mockResolvedValue({ data: null });

      const result = await authService.checkAuth();

      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({});
      (tokenManager.clearTokens as jest.Mock).mockResolvedValue(undefined);

      await authService.logout();

      expect(tokenManager.clearTokens).toHaveBeenCalled();
      expect(mockAuthStore.logout).toHaveBeenCalled();
    });

    it('should clear tokens even if logout endpoint fails', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('API error'));
      (tokenManager.clearTokens as jest.Mock).mockResolvedValue(undefined);

      await authService.logout();

      expect(tokenManager.clearTokens).toHaveBeenCalled();
      expect(mockAuthStore.logout).toHaveBeenCalled();
    });
  });
});
