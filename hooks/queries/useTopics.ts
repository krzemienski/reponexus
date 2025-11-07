/**
 * Topic Query Hooks
 *
 * Provides hooks for fetching and managing topic data with TanStack Query.
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
import type { Topic, PaginatedResponse, Repository } from '@/types/models';
import type { ApiError } from '@/types/api';

// Query Parameter Types
interface TopicListParams {
  page?: number;
  perPage?: number;
  sort?: 'popular' | 'recent' | 'name';
}

/**
 * Hook to fetch a paginated list of topics
 */
export function useTopics(
  params: TopicListParams = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<Topic>, ApiError>, 'queryKey' | 'queryFn'>
) {
  const filterString = JSON.stringify(params);

  return useQuery<PaginatedResponse<Topic>, ApiError>({
    queryKey: queryKeys.topics.list(filterString),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<Topic>>(API_ENDPOINTS.TOPICS, {
        params,
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes - topics don't change frequently
    gcTime: 1000 * 60 * 60, // 1 hour
    placeholderData: (previousData) => previousData,
    ...options,
  });
}

/**
 * Hook to fetch a single topic by name
 */
export function useTopic(
  name: string | undefined,
  options?: Omit<UseQueryOptions<Topic, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Topic, ApiError>({
    queryKey: queryKeys.topics.detail(name || ''),
    queryFn: async () => {
      if (!name) throw new Error('Topic name is required');
      const response = await apiClient.get<Topic>(API_ENDPOINTS.TOPIC_BY_NAME(name));
      return response.data;
    },
    enabled: !!name,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    ...options,
  });
}

/**
 * Hook to fetch the current user's followed topics
 */
export function useUserTopics(
  options?: Omit<UseQueryOptions<Topic[], ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Topic[], ApiError>({
    queryKey: queryKeys.users.topics(),
    queryFn: async () => {
      const response = await apiClient.get<Topic[]>(API_ENDPOINTS.USER_TOPICS);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    ...options,
  });
}

/**
 * Hook to fetch repositories for a specific topic
 */
export function useTopicRepositories(
  name: string | undefined,
  params: { page?: number; perPage?: number; sort?: string } = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<Repository>, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<PaginatedResponse<Repository>, ApiError>({
    queryKey: [...queryKeys.topics.repositories(name || ''), JSON.stringify(params)],
    queryFn: async () => {
      if (!name) throw new Error('Topic name is required');
      const response = await apiClient.get<PaginatedResponse<Repository>>(
        API_ENDPOINTS.TOPIC_REPOSITORIES(name),
        { params }
      );
      return response.data;
    },
    enabled: !!name,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    placeholderData: (previousData) => previousData,
    ...options,
  });
}

/**
 * Hook to fetch topics with infinite scroll
 */
export function useInfiniteTopics(
  params: Omit<TopicListParams, 'page'> = {},
  options?: Omit<
    UseInfiniteQueryOptions<PaginatedResponse<Topic>, ApiError>,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam' | 'select'
  >
) {
  const filterString = JSON.stringify(params);

  return useInfiniteQuery<PaginatedResponse<Topic>, ApiError>({
    queryKey: queryKeys.topics.list(filterString),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<PaginatedResponse<Topic>>(API_ENDPOINTS.TOPICS, {
        params: {
          ...params,
          page: pageParam,
        },
      });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination;
      return page < pages ? page + 1 : undefined;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    ...options,
  });
}

/**
 * Hook to fetch repositories for a topic with infinite scroll
 */
export function useInfiniteTopicRepositories(
  name: string | undefined,
  params: { perPage?: number; sort?: string } = {},
  options?: Omit<
    UseInfiniteQueryOptions<PaginatedResponse<Repository>, ApiError>,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam' | 'select'
  >
) {
  return useInfiniteQuery<PaginatedResponse<Repository>, ApiError>({
    queryKey: [...queryKeys.topics.repositories(name || ''), JSON.stringify(params)],
    queryFn: async ({ pageParam = 1 }) => {
      if (!name) throw new Error('Topic name is required');
      const response = await apiClient.get<PaginatedResponse<Repository>>(
        API_ENDPOINTS.TOPIC_REPOSITORIES(name),
        {
          params: {
            ...params,
            page: pageParam,
          },
        }
      );
      return response.data;
    },
    enabled: !!name,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination;
      return page < pages ? page + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    ...options,
  });
}

/**
 * Hook to check if user is following a topic
 */
export function useIsFollowingTopic(
  name: string | undefined,
  options?: Omit<UseQueryOptions<boolean, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<boolean, ApiError>({
    queryKey: [...queryKeys.topics.detail(name || ''), 'following'],
    queryFn: async () => {
      if (!name) throw new Error('Topic name is required');
      const topic = await apiClient.get<Topic>(API_ENDPOINTS.TOPIC_BY_NAME(name));
      return topic.data.isFollowed;
    },
    enabled: !!name,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    ...options,
  });
}
