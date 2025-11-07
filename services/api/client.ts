import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL, API_ENDPOINTS } from '@/utils/constants';
import { SecureStorageService } from '@/services/storage/secureStore';
import { STORAGE_KEYS } from '@/utils/constants';
import { ApiError } from '@/types/api';

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

    // Handle 401 - Unauthorized (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

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

        const { accessToken } = response.data;

        // Save new token
        await SecureStorageService.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        // TODO: Emit event to logout user
        console.error('Token refresh failed:', refreshError);
        return Promise.reject(refreshError);
      }
    }

    // Transform error to ApiError format
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'An error occurred',
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      status: error.response?.status || 500,
      details: error.response?.data?.details,
    };

    // Log error in development
    if (__DEV__) {
      console.error('[API] Error:', apiError);
    }

    return Promise.reject(apiError);
  }
);

export default apiClient;
