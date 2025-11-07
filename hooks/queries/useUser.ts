/**
 * User Query Hooks
 *
 * Provides hooks for fetching and managing user data with TanStack Query.
 */

import {
  useQuery,
  useInfiniteQuery,
  UseQueryOptions,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import apiClient from '@/services/api/client';
import { queryKeys } from '@/services/api/queryKeys';
import { API_ENDPOINTS } from '@/utils/constants';
import type { User, Repository, PaginatedResponse } from '@/types/models';
import type { ApiError } from '@/types/api';

/**
 * Hook to fetch the current authenticated user
 *
 * This query has shorter cache times due to sensitive user data
 */
export function useCurrentUser(
  options?: Omit<UseQueryOptions<User, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<User, ApiError>({
    queryKey: queryKeys.users.current(),
    queryFn: async () => {
      const response = await apiClient.get<User>(API_ENDPOINTS.USER_ME);
      return response.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes - sensitive data
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 1, // Fewer retries for auth-related queries
    ...options,
  });
}

/**
 * Hook to fetch a user profile by login
 */
export function useUserProfile(
  login: string | undefined,
  options?: Omit<UseQueryOptions<User, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<User, ApiError>({
    queryKey: queryKeys.users.profile(login || ''),
    queryFn: async () => {
      if (!login) throw new Error('User login is required');
      const response = await apiClient.get<User>(API_ENDPOINTS.USER(login));
      return response.data;
    },
    enabled: !!login,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    ...options,
  });
}

/**
 * Hook to fetch the current user's starred repositories
 */
export function useStarredRepositories(
  params: { page?: number; perPage?: number; sort?: string } = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<Repository>, ApiError>, 'queryKey' | 'queryFn'>
) {
  const filterString = JSON.stringify(params);

  return useQuery<PaginatedResponse<Repository>, ApiError>({
    queryKey: [...queryKeys.users.starred(), filterString],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<Repository>>(
        API_ENDPOINTS.USER_STARRED,
        { params }
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 20, // 20 minutes
    placeholderData: (previousData) => previousData,
    ...options,
  });
}

/**
 * Hook to fetch starred repositories with infinite scroll
 */
export function useInfiniteStarredRepositories(
  params: { perPage?: number; sort?: string } = {},
  options?: Omit<
    UseInfiniteQueryOptions<PaginatedResponse<Repository>, ApiError>,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam' | 'select'
  >
) {
  const filterString = JSON.stringify(params);

  return useInfiniteQuery<PaginatedResponse<Repository>, ApiError>({
    queryKey: [...queryKeys.users.starred(), filterString],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<PaginatedResponse<Repository>>(
        API_ENDPOINTS.USER_STARRED,
        {
          params: {
            ...params,
            page: pageParam,
          },
        }
      );
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination;
      return page < pages ? page + 1 : undefined;
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 20, // 20 minutes
    ...options,
  });
}

/**
 * Hook to check if the current user is authenticated
 *
 * This is a lightweight check that doesn't fetch full user data
 */
export function useIsAuthenticated(
  options?: Omit<UseQueryOptions<boolean, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<boolean, ApiError>({
    queryKey: [...queryKeys.users.current(), 'authenticated'],
    queryFn: async () => {
      try {
        await apiClient.get(API_ENDPOINTS.USER_ME);
        return true;
      } catch (error: any) {
        if (error.status === 401) return false;
        throw error;
      }
    },
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Don't retry auth checks
    ...options,
  });
}

/**
 * Hook to get user statistics
 *
 * Returns computed stats from user data
 */
export function useUserStats(
  login?: string,
  options?: Omit<UseQueryOptions<User, ApiError>, 'queryKey' | 'queryFn'>
) {
  const isCurrentUser = !login;

  return useQuery<User, ApiError>({
    queryKey: isCurrentUser
      ? queryKeys.users.current()
      : queryKeys.users.profile(login || ''),
    queryFn: async () => {
      const endpoint = isCurrentUser
        ? API_ENDPOINTS.USER_ME
        : API_ENDPOINTS.USER(login || '');
      const response = await apiClient.get<User>(endpoint);
      return response.data;
    },
    enabled: isCurrentUser || !!login,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    select: (user) => user, // Can be enhanced to compute stats
    ...options,
  });
}
