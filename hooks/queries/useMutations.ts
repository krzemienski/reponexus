/**
 * Mutation Hooks
 *
 * Provides hooks for data mutations with optimistic updates,
 * automatic cache invalidation, and error handling.
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import apiClient from '@/services/api/client';
import { queryKeys } from '@/services/api/queryKeys';
import { API_ENDPOINTS } from '@/utils/constants';
import type { Topic, Repository, User } from '@/types/models';
import type { ApiError } from '@/types/api';

// Mutation parameter types
interface FollowTopicParams {
  topicName: string;
}

interface UnfollowTopicParams {
  topicName: string;
}

interface StarRepositoryParams {
  repositoryId: string;
}

interface UnstarRepositoryParams {
  repositoryId: string;
}

interface UpdateProfileParams {
  name?: string;
  bio?: string;
  company?: string;
  location?: string;
  blog?: string;
  twitterUsername?: string;
}

/**
 * Hook to follow a topic
 *
 * Features:
 * - Optimistic update
 * - Automatic cache invalidation
 * - Error rollback
 * - Toast notification (to be implemented)
 */
export function useFollowTopic(
  options?: Omit<
    UseMutationOptions<void, ApiError, FollowTopicParams>,
    'mutationFn' | 'onMutate' | 'onError' | 'onSuccess'
  >
) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, FollowTopicParams>({
    mutationFn: async ({ topicName }) => {
      const response = await apiClient.post(API_ENDPOINTS.FOLLOW_TOPIC(topicName));
      return response.data;
    },

    // Optimistic update
    onMutate: async ({ topicName }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.topics.detail(topicName) });
      await queryClient.cancelQueries({ queryKey: queryKeys.users.topics() });

      // Snapshot previous values
      const previousTopic = queryClient.getQueryData<Topic>(
        queryKeys.topics.detail(topicName)
      );
      const previousUserTopics = queryClient.getQueryData<Topic[]>(queryKeys.users.topics());

      // Optimistically update topic
      queryClient.setQueryData<Topic>(queryKeys.topics.detail(topicName), (old) =>
        old ? { ...old, isFollowed: true } : old
      );

      // Optimistically update user topics list
      if (previousTopic) {
        queryClient.setQueryData<Topic[]>(queryKeys.users.topics(), (old = []) => [
          { ...previousTopic, isFollowed: true },
          ...old,
        ]);
      }

      // Return context for rollback
      return { previousTopic, previousUserTopics };
    },

    // Rollback on error
    onError: (err, { topicName }, context) => {
      if (context?.previousTopic) {
        queryClient.setQueryData(queryKeys.topics.detail(topicName), context.previousTopic);
      }
      if (context?.previousUserTopics) {
        queryClient.setQueryData(queryKeys.users.topics(), context.previousUserTopics);
      }

      // Show error toast (to be implemented)
      console.error('Failed to follow topic:', err.message);
    },

    // Refetch after success
    onSuccess: async (_, { topicName }) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.topics.detail(topicName) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.topics() });

      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Show success toast (to be implemented)
      console.log('Successfully followed topic');
    },

    ...options,
  });
}

/**
 * Hook to unfollow a topic
 */
export function useUnfollowTopic(
  options?: Omit<
    UseMutationOptions<void, ApiError, UnfollowTopicParams>,
    'mutationFn' | 'onMutate' | 'onError' | 'onSuccess'
  >
) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, UnfollowTopicParams>({
    mutationFn: async ({ topicName }) => {
      const response = await apiClient.delete(API_ENDPOINTS.FOLLOW_TOPIC(topicName));
      return response.data;
    },

    onMutate: async ({ topicName }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.topics.detail(topicName) });
      await queryClient.cancelQueries({ queryKey: queryKeys.users.topics() });

      const previousTopic = queryClient.getQueryData<Topic>(
        queryKeys.topics.detail(topicName)
      );
      const previousUserTopics = queryClient.getQueryData<Topic[]>(queryKeys.users.topics());

      // Optimistically update
      queryClient.setQueryData<Topic>(queryKeys.topics.detail(topicName), (old) =>
        old ? { ...old, isFollowed: false } : old
      );

      queryClient.setQueryData<Topic[]>(queryKeys.users.topics(), (old = []) =>
        old.filter((topic) => topic.name !== topicName)
      );

      return { previousTopic, previousUserTopics };
    },

    onError: (err, { topicName }, context) => {
      if (context?.previousTopic) {
        queryClient.setQueryData(queryKeys.topics.detail(topicName), context.previousTopic);
      }
      if (context?.previousUserTopics) {
        queryClient.setQueryData(queryKeys.users.topics(), context.previousUserTopics);
      }
      console.error('Failed to unfollow topic:', err.message);
    },

    onSuccess: async (_, { topicName }) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.topics.detail(topicName) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.topics() });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },

    ...options,
  });
}

/**
 * Hook to star a repository
 */
export function useStarRepository(
  options?: Omit<
    UseMutationOptions<void, ApiError, StarRepositoryParams>,
    'mutationFn' | 'onMutate' | 'onError' | 'onSuccess'
  >
) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, StarRepositoryParams>({
    mutationFn: async ({ repositoryId }) => {
      const response = await apiClient.put(API_ENDPOINTS.STAR(repositoryId));
      return response.data;
    },

    onMutate: async ({ repositoryId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.repositories.detail(repositoryId) });

      const previousRepository = queryClient.getQueryData<Repository>(
        queryKeys.repositories.detail(repositoryId)
      );

      // Optimistically increment star count
      queryClient.setQueryData<Repository>(
        queryKeys.repositories.detail(repositoryId),
        (old) =>
          old
            ? {
                ...old,
                stargazerCount: old.stargazerCount + 1,
              }
            : old
      );

      return { previousRepository };
    },

    onError: (err, { repositoryId }, context) => {
      if (context?.previousRepository) {
        queryClient.setQueryData(
          queryKeys.repositories.detail(repositoryId),
          context.previousRepository
        );
      }
      console.error('Failed to star repository:', err.message);
    },

    onSuccess: async (_, { repositoryId }) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.repositories.detail(repositoryId),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.starred() });

      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },

    ...options,
  });
}

/**
 * Hook to unstar a repository
 */
export function useUnstarRepository(
  options?: Omit<
    UseMutationOptions<void, ApiError, UnstarRepositoryParams>,
    'mutationFn' | 'onMutate' | 'onError' | 'onSuccess'
  >
) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, UnstarRepositoryParams>({
    mutationFn: async ({ repositoryId }) => {
      const response = await apiClient.delete(API_ENDPOINTS.STAR(repositoryId));
      return response.data;
    },

    onMutate: async ({ repositoryId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.repositories.detail(repositoryId) });

      const previousRepository = queryClient.getQueryData<Repository>(
        queryKeys.repositories.detail(repositoryId)
      );

      // Optimistically decrement star count
      queryClient.setQueryData<Repository>(
        queryKeys.repositories.detail(repositoryId),
        (old) =>
          old
            ? {
                ...old,
                stargazerCount: Math.max(0, old.stargazerCount - 1),
              }
            : old
      );

      return { previousRepository };
    },

    onError: (err, { repositoryId }, context) => {
      if (context?.previousRepository) {
        queryClient.setQueryData(
          queryKeys.repositories.detail(repositoryId),
          context.previousRepository
        );
      }
      console.error('Failed to unstar repository:', err.message);
    },

    onSuccess: async (_, { repositoryId }) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.repositories.detail(repositoryId),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.starred() });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },

    ...options,
  });
}

/**
 * Hook to update user profile
 */
export function useUpdateProfile(
  options?: Omit<
    UseMutationOptions<User, ApiError, UpdateProfileParams>,
    'mutationFn' | 'onSuccess'
  >
) {
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, UpdateProfileParams>({
    mutationFn: async (data) => {
      const response = await apiClient.patch<User>(API_ENDPOINTS.USER_ME, data);
      return response.data;
    },

    onSuccess: async (data) => {
      // Update current user cache
      queryClient.setQueryData(queryKeys.users.current(), data);
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.current() });

      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Show success message (to be implemented)
      console.log('Profile updated successfully');
    },

    ...options,
  });
}

/**
 * Hook to toggle repository star
 *
 * Convenience hook that handles both starring and unstarring
 */
export function useToggleRepositoryStar(repositoryId: string) {
  const star = useStarRepository();
  const unstar = useUnstarRepository();

  return {
    toggle: (isStarred: boolean) => {
      if (isStarred) {
        return unstar.mutate({ repositoryId });
      } else {
        return star.mutate({ repositoryId });
      }
    },
    isLoading: star.isPending || unstar.isPending,
    isError: star.isError || unstar.isError,
    error: star.error || unstar.error,
  };
}

/**
 * Hook to toggle topic follow
 *
 * Convenience hook that handles both following and unfollowing
 */
export function useToggleTopicFollow(topicName: string) {
  const follow = useFollowTopic();
  const unfollow = useUnfollowTopic();

  return {
    toggle: (isFollowing: boolean) => {
      if (isFollowing) {
        return unfollow.mutate({ topicName });
      } else {
        return follow.mutate({ topicName });
      }
    },
    isLoading: follow.isPending || unfollow.isPending,
    isError: follow.isError || unfollow.isError,
    error: follow.error || unfollow.error,
  };
}
