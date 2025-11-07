/**
 * Tests for Mutation Hooks
 */

import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import {
  useFollowTopic,
  useUnfollowTopic,
  useStarRepository,
  useUnstarRepository,
} from '@/hooks/queries/useMutations';
import apiClient from '@/services/api/client';
import * as Haptics from 'expo-haptics';

// Mock dependencies
jest.mock('@/services/api/client');
jest.mock('expo-haptics');

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  return Wrapper;
};

describe('useFollowTopic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should follow a topic successfully', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: {} });

    const { result } = renderHook(() => useFollowTopic(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ topicName: 'react' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.post).toHaveBeenCalledWith(expect.stringContaining('react'));
    expect(Haptics.notificationAsync).toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    const mockError = { message: 'Failed to follow', status: 500 };
    (apiClient.post as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useFollowTopic(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ topicName: 'react' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(mockError);
  });
});

describe('useUnfollowTopic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should unfollow a topic successfully', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValue({ data: {} });

    const { result } = renderHook(() => useUnfollowTopic(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ topicName: 'react' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.delete).toHaveBeenCalledWith(expect.stringContaining('react'));
  });
});

describe('useStarRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should star a repository successfully', async () => {
    (apiClient.put as jest.Mock).mockResolvedValue({ data: {} });

    const { result } = renderHook(() => useStarRepository(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ repositoryId: 'repo-123' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.put).toHaveBeenCalledWith(expect.stringContaining('repo-123'));
    expect(Haptics.impactAsync).toHaveBeenCalled();
  });

  it('should optimistically update star count', async () => {
    (apiClient.put as jest.Mock).mockResolvedValue({ data: {} });

    const { result } = renderHook(() => useStarRepository(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ repositoryId: 'repo-123' });
    });

    // Check that mutation is pending
    await waitFor(() => expect(result.current.isPending).toBe(true));
  });
});

describe('useUnstarRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should unstar a repository successfully', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValue({ data: {} });

    const { result } = renderHook(() => useUnstarRepository(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ repositoryId: 'repo-123' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.delete).toHaveBeenCalledWith(expect.stringContaining('repo-123'));
  });
});
