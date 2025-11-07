// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, unknown>;
}

// Query Types
export interface QueryOptions {
  enabled?: boolean;
  retry?: number;
  retryDelay?: number;
  staleTime?: number;
  cacheTime?: number;
}

// Mutation Types
export interface MutationOptions {
  onSuccess?: () => void;
  onError?: (error: ApiError) => void;
}
