/**
 * Repository Query Hooks
 *
 * Provides hooks for fetching and managing repository data with TanStack Query.
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
import type {
  Repository,
  PaginatedResponse,
  TrendingItem,
  TrendingPeriod,
  SortOption,
} from '@/types/models';
import type { ApiError } from '@/types/api';

// Query Parameter Types
interface RepositoryListParams {
  page?: number;
  perPage?: number;
  sort?: SortOption;
  language?: string;
  topic?: string;
}

interface TrendingParams {
  period: TrendingPeriod;
  language?: string;
}

/**
 * Hook to fetch a paginated list of repositories
 */
export function useRepositories(
  params: RepositoryListParams = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<Repository>, ApiError>, 'queryKey' | 'queryFn'>
) {
  const filterString = JSON.stringify(params);

  return useQuery<PaginatedResponse<Repository>, ApiError>({
    queryKey: queryKeys.repositories.list(filterString),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<Repository>>(
        API_ENDPOINTS.REPOSITORIES,
        { params }
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60, // 1 hour (formerly cacheTime)
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
    ...options,
  });
}

/**
 * Hook to fetch a single repository by ID
 */
export function useRepository(
  id: string | undefined,
  options?: Omit<UseQueryOptions<Repository, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Repository, ApiError>({
    queryKey: queryKeys.repositories.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Repository ID is required');
      const response = await apiClient.get<Repository>(API_ENDPOINTS.REPOSITORY(id));
      return response.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    ...options,
  });
}

/**
 * Hook to fetch repositories with infinite scroll
 */
export function useInfiniteRepositories(
  params: Omit<RepositoryListParams, 'page'> = {},
  options?: Omit<
    UseInfiniteQueryOptions<PaginatedResponse<Repository>, ApiError>,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam' | 'select'
  >
) {
  const filterString = JSON.stringify(params);

  return useInfiniteQuery<PaginatedResponse<Repository>, ApiError>({
    queryKey: queryKeys.repositories.list(filterString),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<PaginatedResponse<Repository>>(
        API_ENDPOINTS.REPOSITORIES,
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
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    ...options,
  });
}

/**
 * Hook to fetch trending repositories
 */
export function useTrending(
  params: TrendingParams,
  options?: Omit<UseQueryOptions<TrendingItem[], ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TrendingItem[], ApiError>({
    queryKey: queryKeys.repositories.trending(params.period, params.language),
    queryFn: async () => {
      const response = await apiClient.get<TrendingItem[]>(API_ENDPOINTS.TRENDING, {
        params: {
          period: params.period,
          language: params.language,
        },
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes for trending data
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: true, // Refetch trending when app becomes active
    refetchOnMount: true,
    ...options,
  });
}

/**
 * Hook to fetch a repository's README
 */
export function useRepositoryReadme(
  id: string | undefined,
  options?: Omit<UseQueryOptions<string, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<string, ApiError>({
    queryKey: queryKeys.repositories.readme(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Repository ID is required');
      const response = await apiClient.get<{ content: string }>(API_ENDPOINTS.README(id));
      return response.data.content;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes - READMEs don't change often
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    ...options,
  });
}

/**
 * Hook to check if a repository is starred by the current user
 */
export function useIsRepositoryStarred(
  id: string | undefined,
  options?: Omit<UseQueryOptions<boolean, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<boolean, ApiError>({
    queryKey: [...queryKeys.repositories.detail(id || ''), 'starred'],
    queryFn: async () => {
      if (!id) throw new Error('Repository ID is required');
      try {
        await apiClient.get(API_ENDPOINTS.STAR(id));
        return true;
      } catch (error: any) {
        if (error.status === 404) return false;
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    ...options,
  });
}
