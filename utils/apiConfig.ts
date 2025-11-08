/**
 * API Configuration Utilities
 *
 * Handles platform-specific API URLs for development and production.
 *
 * Platform considerations:
 * - iOS Simulator: Uses localhost (127.0.0.1)
 * - Android Emulator: Uses 10.0.2.2 (special alias to host machine)
 * - Physical Devices: Uses actual network IP or production URL
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Get the base API URL from environment or default
 */
const getEnvApiUrl = (): string => {
  return Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
};

/**
 * Get the base WebSocket URL from environment or default
 */
const getEnvWsUrl = (): string => {
  return Constants.expoConfig?.extra?.EXPO_PUBLIC_WS_URL || 'ws://localhost:8000';
};

/**
 * Convert localhost URL to platform-specific URL
 *
 * @param url - The base URL (possibly containing localhost)
 * @returns Platform-specific URL
 */
export const getPlatformApiUrl = (url: string): string => {
  // If we're on Android and the URL contains localhost or 127.0.0.1,
  // replace it with 10.0.2.2 (Android emulator's special alias)
  if (Platform.OS === 'android') {
    url = url.replace('localhost', '10.0.2.2');
    url = url.replace('127.0.0.1', '10.0.2.2');
  }

  return url;
};

/**
 * Get the configured API URL for the current platform
 */
export const getApiUrl = (): string => {
  const baseUrl = getEnvApiUrl();
  return getPlatformApiUrl(baseUrl);
};

/**
 * Get the configured WebSocket URL for the current platform
 */
export const getWsUrl = (): string => {
  const baseUrl = getEnvWsUrl();
  return getPlatformApiUrl(baseUrl);
};

/**
 * Check if we're in development mode
 */
export const isDevelopment = (): boolean => {
  return __DEV__ || process.env.NODE_ENV === 'development';
};

/**
 * Check if we're in production mode
 */
export const isProduction = (): boolean => {
  return !__DEV__ && process.env.NODE_ENV === 'production';
};

/**
 * Get the environment name
 */
export const getEnvironment = (): 'development' | 'staging' | 'production' => {
  if (isProduction()) {
    return 'production';
  }
  if (process.env.NODE_ENV === 'staging') {
    return 'staging';
  }
  return 'development';
};

/**
 * Configuration object with all API-related settings
 */
export const apiConfig = {
  baseUrl: getApiUrl(),
  wsUrl: getWsUrl(),
  timeout: 30000,
  isDevelopment: isDevelopment(),
  isProduction: isProduction(),
  environment: getEnvironment(),
  platform: Platform.OS,
  version: Constants.expoConfig?.version || '1.0.0',
  githubClientId: Constants.expoConfig?.extra?.EXPO_PUBLIC_GITHUB_CLIENT_ID || '',
} as const;

/**
 * Log API configuration (useful for debugging)
 */
export const logApiConfig = (): void => {
  if (__DEV__) {
    console.log('=== API Configuration ===');
    console.log('Environment:', apiConfig.environment);
    console.log('Platform:', apiConfig.platform);
    console.log('Base URL:', apiConfig.baseUrl);
    console.log('WebSocket URL:', apiConfig.wsUrl);
    console.log('GitHub Client ID:', apiConfig.githubClientId ? '✓ Set' : '✗ Not Set');
    console.log('========================');
  }
};

export default apiConfig;
