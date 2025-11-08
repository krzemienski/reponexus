/**
 * Suggestions Query Hooks
 *
 * Provides hooks for fetching and managing topic suggestions with TanStack Query.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import apiClient from '@/services/api/client';
import { queryKeys } from '@/services/api/queryKeys';
import { API_ENDPOINTS } from '@/utils/constants';
import type { ApiError } from '@/types/api';

// Types
export interface ExampleRepository {
  id: string;
  nameWithOwner: string;
  description?: string;
  stargazerCount: number;
  primaryLanguage?: string;
}

export interface TopicSuggestion {
  id: string;
  topicId: string;
  topicName: string;
  topicDisplayName: string;
  relevanceScore: number;
  starredRepoCount: number;
  reason?: string;
  isDismissed: boolean;
  isAccepted: boolean;
  suggestedAt: string;
  exampleRepos?: ExampleRepository[];
}

export interface SuggestionsResponse {
  suggestions: TopicSuggestion[];
  total: number;
  hasMore: boolean;
}

export interface DismissSuggestionResponse {
  success: boolean;
  message: string;
  suggestionId: string;
}

export interface AcceptSuggestionResponse {
  success: boolean;
  message: string;
  suggestionId: string;
  topicId: string;
  topicName: string;
}

/**
 * Hook to fetch topic suggestions
 */
export function useSuggestions(
  includeDismissed: boolean = false,
  options?: Omit<UseQueryOptions<SuggestionsResponse, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<SuggestionsResponse, ApiError>({
    queryKey: queryKeys.suggestions.list(includeDismissed),
    queryFn: async () => {
      const response = await apiClient.get<SuggestionsResponse>(
        API_ENDPOINTS.SUGGESTIONS_TOPICS,
        {
          params: { include_dismissed: includeDismissed },
        }
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    ...options,
  });
}

/**
 * Hook to generate new suggestions
 */
export function useGenerateSuggestions(
  options?: Omit<
    UseMutationOptions<void, ApiError, void>,
    'mutationFn' | 'onSuccess'
  >
) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      await apiClient.post(API_ENDPOINTS.SUGGESTIONS_GENERATE);
    },

    onSuccess: () => {
      // Invalidate suggestions query to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.suggestions.all });

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },

    ...options,
  });
}

/**
 * Hook to dismiss a suggestion
 */
export function useDismissSuggestion(
  options?: Omit<
    UseMutationOptions<DismissSuggestionResponse, ApiError, string>,
    'mutationFn' | 'onSuccess'
  >
) {
  const queryClient = useQueryClient();

  return useMutation<DismissSuggestionResponse, ApiError, string>({
    mutationFn: async (suggestionId: string) => {
      const response = await apiClient.post<DismissSuggestionResponse>(
        API_ENDPOINTS.SUGGESTION_DISMISS(suggestionId)
      );
      return response.data;
    },

    onSuccess: (data, suggestionId) => {
      // Remove the dismissed suggestion from the cache optimistically
      queryClient.setQueryData<SuggestionsResponse>(
        queryKeys.suggestions.list(false),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            suggestions: old.suggestions.filter((s) => s.id !== suggestionId),
            total: old.total - 1,
          };
        }
      );

      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.suggestions.all });

      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },

    ...options,
  });
}

/**
 * Hook to accept a suggestion (follow the topic)
 */
export function useAcceptSuggestion(
  options?: Omit<
    UseMutationOptions<AcceptSuggestionResponse, ApiError, string>,
    'mutationFn' | 'onSuccess'
  >
) {
  const queryClient = useQueryClient();

  return useMutation<AcceptSuggestionResponse, ApiError, string>({
    mutationFn: async (suggestionId: string) => {
      const response = await apiClient.post<AcceptSuggestionResponse>(
        API_ENDPOINTS.SUGGESTION_ACCEPT(suggestionId)
      );
      return response.data;
    },

    onSuccess: (data, suggestionId) => {
      // Remove the accepted suggestion from the cache
      queryClient.setQueryData<SuggestionsResponse>(
        queryKeys.suggestions.list(false),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            suggestions: old.suggestions.filter((s) => s.id !== suggestionId),
            total: old.total - 1,
          };
        }
      );

      // Invalidate suggestions and user topics to reflect the change
      queryClient.invalidateQueries({ queryKey: queryKeys.suggestions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.topics() });

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },

    ...options,
  });
}
