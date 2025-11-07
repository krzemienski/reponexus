/**
 * Search Query Hooks
 *
 * Provides hooks for searching repositories and topics with TanStack Query.
 * Includes debouncing for better UX and performance.
 */

import { useState, useEffect } from 'react';
import {
  useQuery,
  useInfiniteQuery,
  UseQueryOptions,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import apiClient from '@/services/api/client';
import { queryKeys } from '@/services/api/queryKeys';
import { API_ENDPOINTS, TIMING } from '@/utils/constants';
import type { Repository, Topic, SearchResult, PaginatedResponse } from '@/types/models';
import type { ApiError } from '@/types/api';

// Search parameter types
interface SearchParams {
  sort?: string;
  order?: 'asc' | 'desc';
  perPage?: number;
}

/**
 * Custom hook for debouncing a value
 */
export function useDebounce<T>(value: T, delay: number = TIMING.debounce): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook to search repositories
 */
export function useSearchRepositories(
  query: string,
  params: SearchParams = {},
  options?: Omit<UseQueryOptions<SearchResult<Repository>, ApiError>, 'queryKey' | 'queryFn'>
) {
  const debouncedQuery = useDebounce(query, TIMING.debounce);

  return useQuery<SearchResult<Repository>, ApiError>({
    queryKey: [...queryKeys.search.repositories(debouncedQuery), JSON.stringify(params)],
    queryFn: async () => {
      const response = await apiClient.get<SearchResult<Repository>>(
        API_ENDPOINTS.SEARCH_REPOSITORIES,
        {
          params: {
            q: debouncedQuery,
            ...params,
          },
        }
      );
      return response.data;
    },
    enabled: debouncedQuery.length >= 2, // Only search with 2+ characters
    staleTime: 1000 * 60 * 2, // 2 minutes - search results change frequently
    gcTime: 1000 * 60 * 10, // 10 minutes
    placeholderData: (previousData) => previousData,
    ...options,
  });
}

/**
 * Hook to search topics
 */
export function useSearchTopics(
  query: string,
  params: SearchParams = {},
  options?: Omit<UseQueryOptions<SearchResult<Topic>, ApiError>, 'queryKey' | 'queryFn'>
) {
  const debouncedQuery = useDebounce(query, TIMING.debounce);

  return useQuery<SearchResult<Topic>, ApiError>({
    queryKey: [...queryKeys.search.topics(debouncedQuery), JSON.stringify(params)],
    queryFn: async () => {
      const response = await apiClient.get<SearchResult<Topic>>(
        API_ENDPOINTS.SEARCH_TOPICS,
        {
          params: {
            q: debouncedQuery,
            ...params,
          },
        }
      );
      return response.data;
    },
    enabled: debouncedQuery.length >= 2, // Only search with 2+ characters
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    placeholderData: (previousData) => previousData,
    ...options,
  });
}

/**
 * Hook to search repositories with infinite scroll
 */
export function useInfiniteSearchRepositories(
  query: string,
  params: Omit<SearchParams, 'page'> = {},
  options?: Omit<
    UseInfiniteQueryOptions<PaginatedResponse<Repository>, ApiError>,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
) {
  const debouncedQuery = useDebounce(query, TIMING.debounce);

  return useInfiniteQuery<PaginatedResponse<Repository>, ApiError>({
    queryKey: [...queryKeys.search.repositories(debouncedQuery), JSON.stringify(params)],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<PaginatedResponse<Repository>>(
        API_ENDPOINTS.SEARCH_REPOSITORIES,
        {
          params: {
            q: debouncedQuery,
            page: pageParam,
            ...params,
          },
        }
      );
      return response.data;
    },
    enabled: debouncedQuery.length >= 2,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination;
      return page < pages ? page + 1 : undefined;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    ...options,
  });
}

/**
 * Hook to search topics with infinite scroll
 */
export function useInfiniteSearchTopics(
  query: string,
  params: Omit<SearchParams, 'page'> = {},
  options?: Omit<
    UseInfiniteQueryOptions<PaginatedResponse<Topic>, ApiError>,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
) {
  const debouncedQuery = useDebounce(query, TIMING.debounce);

  return useInfiniteQuery<PaginatedResponse<Topic>, ApiError>({
    queryKey: [...queryKeys.search.topics(debouncedQuery), JSON.stringify(params)],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<PaginatedResponse<Topic>>(
        API_ENDPOINTS.SEARCH_TOPICS,
        {
          params: {
            q: debouncedQuery,
            page: pageParam,
            ...params,
          },
        }
      );
      return response.data;
    },
    enabled: debouncedQuery.length >= 2,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination;
      return page < pages ? page + 1 : undefined;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    ...options,
  });
}

/**
 * Hook to get search suggestions based on query
 *
 * This provides quick, lightweight search suggestions
 */
export function useSearchSuggestions(
  query: string,
  type: 'repositories' | 'topics' = 'repositories',
  options?: Omit<UseQueryOptions<string[], ApiError>, 'queryKey' | 'queryFn'>
) {
  const debouncedQuery = useDebounce(query, 150); // Faster debounce for suggestions

  return useQuery<string[], ApiError>({
    queryKey: [...queryKeys.search.all, 'suggestions', type, debouncedQuery],
    queryFn: async () => {
      const endpoint =
        type === 'repositories'
          ? API_ENDPOINTS.SEARCH_REPOSITORIES
          : API_ENDPOINTS.SEARCH_TOPICS;

      const response = await apiClient.get<SearchResult<any>>(endpoint, {
        params: {
          q: debouncedQuery,
          perPage: 5, // Only get top 5 for suggestions
        },
      });

      // Extract names/titles for suggestions
      return response.data.items.map((item) =>
        type === 'repositories' ? item.nameWithOwner : item.name
      );
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}
