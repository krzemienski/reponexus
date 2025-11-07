import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import apiClient from '@/services/api/client';
import { tokenManager } from './tokenManager';
import { useAuthStore } from '@/stores/authStore';
import { API_ENDPOINTS, GITHUB_CLIENT_ID, OAUTH_SCOPES } from '@/utils/constants';
import { AuthResponse, LoginRequest } from '@/types/auth';
import { User } from '@/types/models';

// Configure WebBrowser for better authentication flow
WebBrowser.maybeCompleteAuthSession();

/**
 * GitHub OAuth Configuration
 */
const discovery = {
  authorizationEndpoint: 'https://github.com/login/oauth/authorize',
  tokenEndpoint: 'https://github.com/login/oauth/access_token',
  revocationEndpoint: 'https://github.com/settings/connections/applications',
};

/**
 * Create redirect URI for OAuth callback
 */
export const makeAuthRedirectUri = () => {
  return makeRedirectUri({
    scheme: 'reponexus',
    path: 'callback',
  });
};

/**
 * Authentication Service
 * Handles GitHub OAuth flow and token management
 */
class AuthService {
  private request: AuthSession.AuthRequest | null = null;

  /**
   * Initialize OAuth request
   */
  private async initializeRequest(): Promise<AuthSession.AuthRequest> {
    if (this.request) {
      return this.request;
    }

    const redirectUri = makeAuthRedirectUri();

    this.request = new AuthSession.AuthRequest({
      clientId: GITHUB_CLIENT_ID,
      scopes: OAUTH_SCOPES,
      redirectUri,
      usePKCE: false, // GitHub doesn't support PKCE
      state: AuthSession.generateRandom(32), // CSRF protection
    });

    return this.request;
  }

  /**
   * Initiate login flow
   * Opens GitHub OAuth authorization page
   */
  async initiateLogin(): Promise<AuthSession.AuthSessionResult> {
    try {
      const request = await this.initializeRequest();
      const result = await request.promptAsync(discovery, {
        useProxy: false,
        showInRecents: true,
      });

      return result;
    } catch (error) {
      console.error('[AuthService] Login initiation failed:', error);
      throw new Error('Failed to initiate login');
    }
  }

  /**
   * Handle OAuth callback
   * Processes the authorization code and exchanges it for tokens
   */
  async handleCallback(
    result: AuthSession.AuthSessionResult
  ): Promise<AuthResponse | null> {
    try {
      // Check if user cancelled
      if (result.type === 'cancel' || result.type === 'dismiss') {
        throw new Error('Login cancelled by user');
      }

      // Check for errors
      if (result.type === 'error') {
        throw new Error(result.error?.message || 'OAuth error occurred');
      }

      // Check if we got a code
      if (result.type !== 'success' || !result.params.code) {
        throw new Error('No authorization code received');
      }

      // Exchange code for token
      const authResponse = await this.exchangeCodeForToken(result.params.code);

      if (!authResponse) {
        throw new Error('Failed to exchange code for token');
      }

      // Save tokens
      await tokenManager.saveTokens({
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
        expiresAt: Date.now() + authResponse.expiresIn * 1000,
      });

      // Update auth store
      useAuthStore.getState().setUser(authResponse.user);
      useAuthStore.getState().setAuthenticated(true);

      return authResponse;
    } catch (error) {
      console.error('[AuthService] Callback handling failed:', error);
      throw error;
    }
  }

  /**
   * Exchange authorization code for access token
   * Calls backend API to exchange the code
   */
  async exchangeCodeForToken(code: string): Promise<AuthResponse | null> {
    try {
      const loginRequest: LoginRequest = { code };
      const response = await apiClient.post<AuthResponse>(
        API_ENDPOINTS.CALLBACK,
        loginRequest
      );

      return response.data;
    } catch (error) {
      console.error('[AuthService] Token exchange failed:', error);
      throw new Error('Failed to exchange code for token');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await tokenManager.getRefreshToken();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post<{ accessToken: string; expiresIn: number }>(
        API_ENDPOINTS.REFRESH,
        { refreshToken }
      );

      const { accessToken, expiresIn } = response.data;

      // Update tokens
      await tokenManager.saveTokens({
        accessToken,
        refreshToken,
        expiresAt: Date.now() + expiresIn * 1000,
      });

      return accessToken;
    } catch (error) {
      console.error('[AuthService] Token refresh failed:', error);
      // Clear tokens and logout
      await this.logout();
      return null;
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<User>(API_ENDPOINTS.ME);
      return response.data;
    } catch (error) {
      console.error('[AuthService] Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   * Validates token and fetches user data
   */
  async checkAuth(): Promise<boolean> {
    try {
      const accessToken = await tokenManager.getAccessToken();

      if (!accessToken) {
        return false;
      }

      // Check if token is expired
      const isExpired = await tokenManager.isTokenExpired();

      if (isExpired) {
        // Try to refresh token
        const newToken = await this.refreshToken();
        if (!newToken) {
          return false;
        }
      }

      // Fetch current user
      const user = await this.getCurrentUser();

      if (!user) {
        return false;
      }

      // Update auth store
      useAuthStore.getState().setUser(user);
      useAuthStore.getState().setAuthenticated(true);

      return true;
    } catch (error) {
      console.error('[AuthService] Auth check failed:', error);
      return false;
    }
  }

  /**
   * Logout user
   * Clears tokens and resets auth state
   */
  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint (optional)
      try {
        await apiClient.post(API_ENDPOINTS.LOGOUT);
      } catch (error) {
        // Ignore logout endpoint errors
        console.warn('[AuthService] Logout endpoint failed:', error);
      }

      // Clear tokens
      await tokenManager.clearTokens();

      // Reset auth store
      useAuthStore.getState().logout();

      // Clear request
      this.request = null;
    } catch (error) {
      console.error('[AuthService] Logout failed:', error);
      throw error;
    }
  }

  /**
   * Revoke GitHub OAuth access
   * This will revoke the app's access on GitHub
   */
  async revokeAccess(): Promise<void> {
    try {
      await this.logout();

      // Open GitHub settings page for user to manually revoke
      const revokeUrl = `https://github.com/settings/connections/applications/${GITHUB_CLIENT_ID}`;
      await WebBrowser.openBrowserAsync(revokeUrl);
    } catch (error) {
      console.error('[AuthService] Revoke access failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
