import { SecureStorageService } from '@/services/storage/secureStore';
import { STORAGE_KEYS } from '@/utils/constants';
import { TokenData } from '@/types/auth';

/**
 * Token Manager
 * Handles secure storage and retrieval of authentication tokens
 */
class TokenManager {
  /**
   * Save authentication tokens to secure storage
   */
  async saveTokens(tokenData: TokenData): Promise<void> {
    try {
      await Promise.all([
        SecureStorageService.setItem(
          STORAGE_KEYS.ACCESS_TOKEN,
          tokenData.accessToken
        ),
        SecureStorageService.setItem(
          STORAGE_KEYS.REFRESH_TOKEN,
          tokenData.refreshToken
        ),
        SecureStorageService.setItem(
          STORAGE_KEYS.TOKEN_EXPIRES_AT,
          tokenData.expiresAt.toString()
        ),
      ]);

      if (__DEV__) {
        console.log('[TokenManager] Tokens saved successfully');
      }
    } catch (error) {
      console.error('[TokenManager] Failed to save tokens:', error);
      throw new Error('Failed to save authentication tokens');
    }
  }

  /**
   * Get access token from secure storage
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const token = await SecureStorageService.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      return token;
    } catch (error) {
      console.error('[TokenManager] Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Get refresh token from secure storage
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      const token = await SecureStorageService.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      return token;
    } catch (error) {
      console.error('[TokenManager] Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * Get token expiration timestamp
   */
  async getTokenExpiresAt(): Promise<number | null> {
    try {
      const expiresAt = await SecureStorageService.getItem(
        STORAGE_KEYS.TOKEN_EXPIRES_AT
      );

      if (!expiresAt) {
        return null;
      }

      return parseInt(expiresAt, 10);
    } catch (error) {
      console.error('[TokenManager] Failed to get token expiration:', error);
      return null;
    }
  }

  /**
   * Check if access token is expired
   * Returns true if token is expired or expiring within 5 minutes
   */
  async isTokenExpired(): Promise<boolean> {
    try {
      const expiresAt = await this.getTokenExpiresAt();

      if (!expiresAt) {
        return true;
      }

      // Add 5 minute buffer for token refresh
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      const now = Date.now();

      return now >= expiresAt - bufferTime;
    } catch (error) {
      console.error('[TokenManager] Failed to check token expiration:', error);
      return true;
    }
  }

  /**
   * Get time until token expires (in milliseconds)
   * Returns 0 if token is expired or not found
   */
  async getTimeUntilExpiry(): Promise<number> {
    try {
      const expiresAt = await this.getTokenExpiresAt();

      if (!expiresAt) {
        return 0;
      }

      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      return Math.max(0, timeUntilExpiry);
    } catch (error) {
      console.error('[TokenManager] Failed to calculate time until expiry:', error);
      return 0;
    }
  }

  /**
   * Check if tokens exist
   */
  async hasTokens(): Promise<boolean> {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.getAccessToken(),
        this.getRefreshToken(),
      ]);

      return !!(accessToken && refreshToken);
    } catch (error) {
      console.error('[TokenManager] Failed to check tokens:', error);
      return false;
    }
  }

  /**
   * Clear all authentication tokens
   */
  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        SecureStorageService.deleteItem(STORAGE_KEYS.ACCESS_TOKEN),
        SecureStorageService.deleteItem(STORAGE_KEYS.REFRESH_TOKEN),
        SecureStorageService.deleteItem(STORAGE_KEYS.TOKEN_EXPIRES_AT),
      ]);

      if (__DEV__) {
        console.log('[TokenManager] Tokens cleared successfully');
      }
    } catch (error) {
      console.error('[TokenManager] Failed to clear tokens:', error);
      throw new Error('Failed to clear authentication tokens');
    }
  }

  /**
   * Update only the access token (used after token refresh)
   */
  async updateAccessToken(accessToken: string, expiresIn: number): Promise<void> {
    try {
      const expiresAt = Date.now() + expiresIn * 1000;

      await Promise.all([
        SecureStorageService.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
        SecureStorageService.setItem(
          STORAGE_KEYS.TOKEN_EXPIRES_AT,
          expiresAt.toString()
        ),
      ]);

      if (__DEV__) {
        console.log('[TokenManager] Access token updated successfully');
      }
    } catch (error) {
      console.error('[TokenManager] Failed to update access token:', error);
      throw new Error('Failed to update access token');
    }
  }

  /**
   * Get all token data
   * Useful for debugging and testing
   */
  async getTokenData(): Promise<TokenData | null> {
    try {
      const [accessToken, refreshToken, expiresAt] = await Promise.all([
        this.getAccessToken(),
        this.getRefreshToken(),
        this.getTokenExpiresAt(),
      ]);

      if (!accessToken || !refreshToken || !expiresAt) {
        return null;
      }

      return {
        accessToken,
        refreshToken,
        expiresAt,
      };
    } catch (error) {
      console.error('[TokenManager] Failed to get token data:', error);
      return null;
    }
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();
export default tokenManager;
