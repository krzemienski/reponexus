import { tokenManager } from '@/services/auth/tokenManager';
import { SecureStorageService } from '@/services/storage/secureStore';
import { STORAGE_KEYS } from '@/utils/constants';

// Mock SecureStorageService
jest.mock('@/services/storage/secureStore');

describe('TokenManager', () => {
  const mockTokenData = {
    accessToken: 'mock_access_token',
    refreshToken: 'mock_refresh_token',
    expiresAt: Date.now() + 3600000, // 1 hour from now
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveTokens', () => {
    it('should save all tokens to secure storage', async () => {
      (SecureStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      await tokenManager.saveTokens(mockTokenData);

      expect(SecureStorageService.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ACCESS_TOKEN,
        mockTokenData.accessToken
      );
      expect(SecureStorageService.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.REFRESH_TOKEN,
        mockTokenData.refreshToken
      );
      expect(SecureStorageService.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.TOKEN_EXPIRES_AT,
        mockTokenData.expiresAt.toString()
      );
    });

    it('should throw error if saving fails', async () => {
      (SecureStorageService.setItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      await expect(tokenManager.saveTokens(mockTokenData)).rejects.toThrow(
        'Failed to save authentication tokens'
      );
    });
  });

  describe('getAccessToken', () => {
    it('should retrieve access token', async () => {
      (SecureStorageService.getItem as jest.Mock).mockResolvedValue(
        mockTokenData.accessToken
      );

      const token = await tokenManager.getAccessToken();

      expect(token).toBe(mockTokenData.accessToken);
      expect(SecureStorageService.getItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ACCESS_TOKEN
      );
    });

    it('should return null if token does not exist', async () => {
      (SecureStorageService.getItem as jest.Mock).mockResolvedValue(null);

      const token = await tokenManager.getAccessToken();

      expect(token).toBeNull();
    });

    it('should return null on error', async () => {
      (SecureStorageService.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const token = await tokenManager.getAccessToken();

      expect(token).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('should retrieve refresh token', async () => {
      (SecureStorageService.getItem as jest.Mock).mockResolvedValue(
        mockTokenData.refreshToken
      );

      const token = await tokenManager.getRefreshToken();

      expect(token).toBe(mockTokenData.refreshToken);
      expect(SecureStorageService.getItem).toHaveBeenCalledWith(
        STORAGE_KEYS.REFRESH_TOKEN
      );
    });

    it('should return null if token does not exist', async () => {
      (SecureStorageService.getItem as jest.Mock).mockResolvedValue(null);

      const token = await tokenManager.getRefreshToken();

      expect(token).toBeNull();
    });
  });

  describe('getTokenExpiresAt', () => {
    it('should retrieve token expiration timestamp', async () => {
      (SecureStorageService.getItem as jest.Mock).mockResolvedValue(
        mockTokenData.expiresAt.toString()
      );

      const expiresAt = await tokenManager.getTokenExpiresAt();

      expect(expiresAt).toBe(mockTokenData.expiresAt);
      expect(SecureStorageService.getItem).toHaveBeenCalledWith(
        STORAGE_KEYS.TOKEN_EXPIRES_AT
      );
    });

    it('should return null if expiration does not exist', async () => {
      (SecureStorageService.getItem as jest.Mock).mockResolvedValue(null);

      const expiresAt = await tokenManager.getTokenExpiresAt();

      expect(expiresAt).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', async () => {
      const futureTime = Date.now() + 3600000; // 1 hour from now
      (SecureStorageService.getItem as jest.Mock).mockResolvedValue(
        futureTime.toString()
      );

      const isExpired = await tokenManager.isTokenExpired();

      expect(isExpired).toBe(false);
    });

    it('should return true for expired token', async () => {
      const pastTime = Date.now() - 3600000; // 1 hour ago
      (SecureStorageService.getItem as jest.Mock).mockResolvedValue(
        pastTime.toString()
      );

      const isExpired = await tokenManager.isTokenExpired();

      expect(isExpired).toBe(true);
    });

    it('should return true for token expiring within buffer time', async () => {
      const soonToExpire = Date.now() + 60000; // 1 minute from now (less than 5 min buffer)
      (SecureStorageService.getItem as jest.Mock).mockResolvedValue(
        soonToExpire.toString()
      );

      const isExpired = await tokenManager.isTokenExpired();

      expect(isExpired).toBe(true);
    });

    it('should return true when expiration is not set', async () => {
      (SecureStorageService.getItem as jest.Mock).mockResolvedValue(null);

      const isExpired = await tokenManager.isTokenExpired();

      expect(isExpired).toBe(true);
    });

    it('should return true on error', async () => {
      (SecureStorageService.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const isExpired = await tokenManager.isTokenExpired();

      expect(isExpired).toBe(true);
    });
  });

  describe('getTimeUntilExpiry', () => {
    it('should return time until expiry in milliseconds', async () => {
      const futureTime = Date.now() + 3600000; // 1 hour from now
      (SecureStorageService.getItem as jest.Mock).mockResolvedValue(
        futureTime.toString()
      );

      const timeUntilExpiry = await tokenManager.getTimeUntilExpiry();

      expect(timeUntilExpiry).toBeGreaterThan(3500000); // Should be close to 1 hour
      expect(timeUntilExpiry).toBeLessThanOrEqual(3600000);
    });

    it('should return 0 for expired token', async () => {
      const pastTime = Date.now() - 3600000; // 1 hour ago
      (SecureStorageService.getItem as jest.Mock).mockResolvedValue(
        pastTime.toString()
      );

      const timeUntilExpiry = await tokenManager.getTimeUntilExpiry();

      expect(timeUntilExpiry).toBe(0);
    });

    it('should return 0 when expiration is not set', async () => {
      (SecureStorageService.getItem as jest.Mock).mockResolvedValue(null);

      const timeUntilExpiry = await tokenManager.getTimeUntilExpiry();

      expect(timeUntilExpiry).toBe(0);
    });
  });

  describe('hasTokens', () => {
    it('should return true when both tokens exist', async () => {
      (SecureStorageService.getItem as jest.Mock)
        .mockResolvedValueOnce(mockTokenData.accessToken)
        .mockResolvedValueOnce(mockTokenData.refreshToken);

      const hasTokens = await tokenManager.hasTokens();

      expect(hasTokens).toBe(true);
    });

    it('should return false when access token is missing', async () => {
      (SecureStorageService.getItem as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockTokenData.refreshToken);

      const hasTokens = await tokenManager.hasTokens();

      expect(hasTokens).toBe(false);
    });

    it('should return false when refresh token is missing', async () => {
      (SecureStorageService.getItem as jest.Mock)
        .mockResolvedValueOnce(mockTokenData.accessToken)
        .mockResolvedValueOnce(null);

      const hasTokens = await tokenManager.hasTokens();

      expect(hasTokens).toBe(false);
    });

    it('should return false on error', async () => {
      (SecureStorageService.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const hasTokens = await tokenManager.hasTokens();

      expect(hasTokens).toBe(false);
    });
  });

  describe('clearTokens', () => {
    it('should clear all tokens from secure storage', async () => {
      (SecureStorageService.deleteItem as jest.Mock).mockResolvedValue(undefined);

      await tokenManager.clearTokens();

      expect(SecureStorageService.deleteItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ACCESS_TOKEN
      );
      expect(SecureStorageService.deleteItem).toHaveBeenCalledWith(
        STORAGE_KEYS.REFRESH_TOKEN
      );
      expect(SecureStorageService.deleteItem).toHaveBeenCalledWith(
        STORAGE_KEYS.TOKEN_EXPIRES_AT
      );
    });

    it('should throw error if clearing fails', async () => {
      (SecureStorageService.deleteItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      await expect(tokenManager.clearTokens()).rejects.toThrow(
        'Failed to clear authentication tokens'
      );
    });
  });

  describe('updateAccessToken', () => {
    it('should update access token and expiration', async () => {
      (SecureStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      const newToken = 'new_access_token';
      const expiresIn = 3600; // 1 hour

      await tokenManager.updateAccessToken(newToken, expiresIn);

      expect(SecureStorageService.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ACCESS_TOKEN,
        newToken
      );
      expect(SecureStorageService.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.TOKEN_EXPIRES_AT,
        expect.any(String)
      );
    });

    it('should throw error if update fails', async () => {
      (SecureStorageService.setItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      await expect(tokenManager.updateAccessToken('token', 3600)).rejects.toThrow(
        'Failed to update access token'
      );
    });
  });

  describe('getTokenData', () => {
    it('should retrieve all token data', async () => {
      (SecureStorageService.getItem as jest.Mock)
        .mockResolvedValueOnce(mockTokenData.accessToken)
        .mockResolvedValueOnce(mockTokenData.refreshToken)
        .mockResolvedValueOnce(mockTokenData.expiresAt.toString());

      const tokenData = await tokenManager.getTokenData();

      expect(tokenData).toEqual(mockTokenData);
    });

    it('should return null if any token is missing', async () => {
      (SecureStorageService.getItem as jest.Mock)
        .mockResolvedValueOnce(mockTokenData.accessToken)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockTokenData.expiresAt.toString());

      const tokenData = await tokenManager.getTokenData();

      expect(tokenData).toBeNull();
    });

    it('should return null on error', async () => {
      (SecureStorageService.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const tokenData = await tokenManager.getTokenData();

      expect(tokenData).toBeNull();
    });
  });
});
