/**
 * Sync Query Hooks
 *
 * Provides hooks for syncing starred repos and monitoring sync status with TanStack Query.
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
export interface SyncRequest {
  maxRepos?: number;
}

export interface SyncResponse {
  success: boolean;
  taskId: string;
  message: string;
  userId: string;
}

export interface SyncStatusResponse {
  taskId: string;
  status: 'PENDING' | 'STARTED' | 'SUCCESS' | 'FAILURE' | 'RETRY';
  ready: boolean;
  successful?: boolean;
  result?: {
    success: boolean;
    totalStarred: number;
    reposCreated: number;
    reposUpdated: number;
    starsCreated: number;
    starsUpdated: number;
  };
  error?: string;
}

export interface UserSyncStatusResponse {
  totalStarred: number;
  lastSyncAt?: string;
  hasSynced: boolean;
}

/**
 * Hook to get user's sync status
 */
export function useUserSyncStatus(
  options?: Omit<UseQueryOptions<UserSyncStatusResponse, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<UserSyncStatusResponse, ApiError>({
    queryKey: queryKeys.sync.userStatus(),
    queryFn: async () => {
      const response = await apiClient.get<UserSyncStatusResponse>(
        API_ENDPOINTS.SYNC_USER_STATUS
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    ...options,
  });
}

/**
 * Hook to monitor a sync task's status
 */
export function useSyncStatus(
  taskId: string | undefined,
  options?: Omit<UseQueryOptions<SyncStatusResponse, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<SyncStatusResponse, ApiError>({
    queryKey: queryKeys.sync.status(taskId || ''),
    queryFn: async () => {
      if (!taskId) throw new Error('Task ID is required');
      const response = await apiClient.get<SyncStatusResponse>(
        API_ENDPOINTS.SYNC_STATUS(taskId)
      );
      return response.data;
    },
    enabled: !!taskId,
    // Poll every 2 seconds until the task is complete
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.ready) {
        return false; // Stop polling
      }
      return 2000; // Poll every 2 seconds
    },
    staleTime: 0, // Always consider stale so it refetches
    gcTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Hook to trigger starred repos sync
 */
export function useSyncStarredRepos(
  options?: Omit<
    UseMutationOptions<SyncResponse, ApiError, SyncRequest>,
    'mutationFn' | 'onSuccess'
  >
) {
  const queryClient = useQueryClient();

  return useMutation<SyncResponse, ApiError, SyncRequest>({
    mutationFn: async (request: SyncRequest) => {
      const response = await apiClient.post<SyncResponse>(
        API_ENDPOINTS.SYNC_STARRED,
        request
      );
      return response.data;
    },

    onSuccess: (data) => {
      // Invalidate user sync status to show updated info
      queryClient.invalidateQueries({ queryKey: queryKeys.sync.userStatus() });

      // Invalidate starred repos to refresh after sync completes
      // (we'll use the task status to know when to invalidate)

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },

    ...options,
  });
}

/**
 * Custom hook that combines sync trigger with status monitoring
 */
export function useSyncWithStatus() {
  const queryClient = useQueryClient();
  const syncMutation = useSyncStarredRepos();

  // Track the task ID from the sync response
  const taskId = syncMutation.data?.taskId;

  // Monitor the sync status
  const statusQuery = useSyncStatus(taskId, {
    onSuccess: (data) => {
      // If sync completed successfully, invalidate relevant queries
      if (data.ready && data.successful) {
        queryClient.invalidateQueries({ queryKey: queryKeys.sync.userStatus() });
        queryClient.invalidateQueries({ queryKey: queryKeys.suggestions.all });
      }
    },
  });

  return {
    // Sync trigger
    triggerSync: syncMutation.mutate,
    triggering: syncMutation.isPending,
    triggerError: syncMutation.error,

    // Sync status
    taskId,
    status: statusQuery.data?.status,
    ready: statusQuery.data?.ready,
    successful: statusQuery.data?.successful,
    result: statusQuery.data?.result,
    error: statusQuery.data?.error || syncMutation.error,

    // Combined state
    isLoading: syncMutation.isPending || (!!taskId && !statusQuery.data?.ready),
    isSuccess: statusQuery.data?.ready && statusQuery.data?.successful,
    isError: syncMutation.isError || (statusQuery.data?.ready && !statusQuery.data?.successful),
  };
}
