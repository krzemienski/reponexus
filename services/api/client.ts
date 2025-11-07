import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL, API_ENDPOINTS, STORAGE_KEYS } from '@/utils/constants';
import { SecureStorageService } from '@/services/storage/secureStore';
import { ApiError } from '@/types/api';

// Keep track of refresh token promise to avoid multiple simultaneous refresh requests
let refreshTokenPromise: Promise<string> | null = null;

// Track if we're currently refreshing to prevent infinite loops
let isRefreshing = false;

// Queue of failed requests to retry after token refresh
type FailedRequest = {
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
};
let failedRequestsQueue: FailedRequest[] = [];

/**
 * Process queued requests after token refresh
 */
const processQueue = (error: Error | null, token: string | null = null) => {
  failedRequestsQueue.forEach((request) => {
    if (error) {
      request.reject(error);
    } else {
      request.resolve(token);
    }
  });

  failedRequestsQueue = [];
};

/**
 * Create Axios instance
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add auth token to requests
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get access token from secure storage
    const token = await SecureStorageService.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (__DEV__) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors and token refresh
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (__DEV__) {
      console.log(`[API] Response ${response.config.url}:`, response.status);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Don't retry if there's no config or if it's already a retry
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle 401 - Unauthorized (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry refresh or auth endpoints
      const isAuthEndpoint =
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/callback');

      if (isAuthEndpoint) {
        // Transform error and reject
        const errorData = error.response?.data as any;
        const apiError: ApiError = {
          message: errorData?.message || 'Authentication failed',
          code: errorData?.code || 'AUTH_ERROR',
          status: 401,
          details: errorData?.details,
        };

        return Promise.reject(apiError);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Mark as retry to prevent infinite loops
      originalRequest._retry = true;
      isRefreshing = true;

      // Create or reuse refresh token promise
      if (!refreshTokenPromise) {
        refreshTokenPromise = (async () => {
          try {
            // Get refresh token
            const refreshToken = await SecureStorageService.getItem(
              STORAGE_KEYS.REFRESH_TOKEN
            );

            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            // Refresh the access token
            const response = await axios.post(`${API_URL}${API_ENDPOINTS.REFRESH}`, {
              refreshToken,
            });

            const { accessToken, expiresIn } = response.data;

            // Save new token and expiration
            const expiresAt = Date.now() + expiresIn * 1000;
            await Promise.all([
              SecureStorageService.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
              SecureStorageService.setItem(
                STORAGE_KEYS.TOKEN_EXPIRES_AT,
                expiresAt.toString()
              ),
            ]);

            if (__DEV__) {
              console.log('[API] Token refreshed successfully');
            }

            return accessToken;
          } catch (refreshError) {
            // Clear tokens on refresh failure
            await Promise.all([
              SecureStorageService.deleteItem(STORAGE_KEYS.ACCESS_TOKEN),
              SecureStorageService.deleteItem(STORAGE_KEYS.REFRESH_TOKEN),
              SecureStorageService.deleteItem(STORAGE_KEYS.TOKEN_EXPIRES_AT),
            ]);

            if (__DEV__) {
              console.error('[API] Token refresh failed:', refreshError);
            }

            throw refreshError;
          }
        })();
      }

      try {
        const newToken = await refreshTokenPromise;

        // Process queued requests
        processQueue(null, newToken);

        // Retry original request with new token
        if (originalRequest.headers && newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError: any) {
        // Process queued requests with error
        processQueue(refreshError, null);

        // Emit logout event
        // Note: This would typically trigger a navigation to login
        if (__DEV__) {
          console.error('[API] Token refresh failed, user needs to re-authenticate');
        }

        // Transform error
        const apiError: ApiError = {
          message: 'Session expired. Please login again.',
          code: 'TOKEN_REFRESH_FAILED',
          status: 401,
          details: refreshError?.message,
        };

        return Promise.reject(apiError);
      } finally {
        isRefreshing = false;
        refreshTokenPromise = null;
      }
    }

    // Handle other error status codes
    let apiError: ApiError;

    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data as any;
      apiError = {
        message:
          errorData?.message ||
          error.message ||
          'An error occurred',
        code: errorData?.code || 'API_ERROR',
        status: error.response.status,
        details: errorData?.details,
      };
    } else if (error.request) {
      // Request was made but no response received
      apiError = {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
        status: 0,
      };
    } else {
      // Something else happened
      apiError = {
        message: error.message || 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        status: 500,
      };
    }

    // Log error in development
    if (__DEV__) {
      console.error('[API] Error:', apiError);
    }

    return Promise.reject(apiError);
  }
);

/**
 * Set auth token manually (useful for testing)
 */
export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

/**
 * Clear all pending refresh operations (useful for logout)
 */
export const clearRefreshState = () => {
  isRefreshing = false;
  refreshTokenPromise = null;
  processQueue(new Error('Logged out'), null);
};

export default apiClient;
