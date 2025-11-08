import { getApiUrl, getWsUrl } from './apiConfig';
import Constants from 'expo-constants';

// API Configuration
export const API_URL = getApiUrl();
export const WS_URL = getWsUrl();
export const GITHUB_CLIENT_ID = Constants.expoConfig?.extra?.EXPO_PUBLIC_GITHUB_CLIENT_ID || '';

// OAuth Configuration
export const OAUTH_SCOPES = ['user', 'repo', 'read:org'];
export const OAUTH_REDIRECT_URI = 'reponexus://callback';

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  TOKEN_EXPIRES_AT: 'token_expires_at',
  USER_DATA: 'user_data',
  THEME: 'theme',
  BIOMETRIC_ENABLED: 'biometric_enabled',
} as const;

// Cache Keys
export const CACHE_KEYS = {
  REPOSITORIES: 'repositories',
  TRENDING: 'trending',
  TOPICS: 'topics',
  USER_TOPICS: 'user_topics',
  STARRED_REPOS: 'starred_repos',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/v1/auth/login',
  CALLBACK: '/api/v1/auth/callback',
  REFRESH: '/api/v1/auth/refresh',
  LOGOUT: '/api/v1/auth/logout',
  ME: '/api/v1/auth/me',

  // Repositories
  REPOSITORIES: '/api/v1/repositories',
  REPOSITORY: (id: string) => `/api/v1/repositories/${id}`,
  TRENDING: '/api/v1/repositories/trending',
  README: (id: string) => `/api/v1/repositories/${id}/readme`,
  STAR: (id: string) => `/api/v1/repositories/${id}/star`,

  // Topics
  TOPICS: '/api/v1/topics',
  TOPIC: (id: string) => `/api/v1/topics/${id}`,
  TOPIC_BY_NAME: (name: string) => `/api/v1/topics/${name}`,
  FOLLOW_TOPIC: (id: string) => `/api/v1/topics/${id}/follow`,
  TOPIC_REPOSITORIES: (name: string) => `/api/v1/topics/${name}/repositories`,

  // Search
  SEARCH_REPOSITORIES: '/api/v1/search/repositories',
  SEARCH_TOPICS: '/api/v1/search/topics',
  SEARCH_USERS: '/api/v1/search/users',

  // Users
  USER_ME: '/api/v1/users/me',
  USER_STARRED: '/api/v1/users/me/starred',
  USER_TOPICS: '/api/v1/users/me/topics',
  USER: (login: string) => `/api/v1/users/${login}`,
} as const;

// Colors (matching Tailwind config)
export const COLORS = {
  primary: '#0ea5e9',
  secondary: '#d946ef',
  dark: '#18181b',
  light: '#fafafa',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
} as const;

// Dimensions
export const DIMENSIONS = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
} as const;

// Timing
export const TIMING = {
  debounce: 300,
  animation: 200,
  toast: 3000,
  sessionTimeout: 1800000, // 30 minutes
} as const;

// Pagination
export const PAGINATION = {
  defaultPage: 1,
  defaultPerPage: 20,
  maxPerPage: 100,
} as const;
