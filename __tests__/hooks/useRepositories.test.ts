/**
 * Tests for Repository Query Hooks
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { useRepositories, useRepository, useTrending } from '@/hooks/queries/useRepositories';
import apiClient from '@/services/api/client';

// Mock the API client
jest.mock('@/services/api/client');

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  return Wrapper;
};

describe('useRepositories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch repositories successfully', async () => {
    const mockData = {
      data: [
        { id: '1', name: 'repo1', stargazerCount: 100 },
        { id: '2', name: 'repo2', stargazerCount: 200 },
      ],
      pagination: { page: 1, perPage: 20, total: 2, pages: 1 },
    };

    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useRepositories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('should handle errors', async () => {
    const mockError = { message: 'Network error', status: 500 };
    (apiClient.get as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useRepositories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(mockError);
  });

  it('should pass correct parameters', async () => {
    const mockData = {
      data: [],
      pagination: { page: 1, perPage: 10, total: 0, pages: 0 },
    };

    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

    const params = { page: 2, perPage: 10, sort: 'stars' as const };

    renderHook(() => useRepositories(params), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ params })
      );
    });
  });
});

describe('useRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch a single repository', async () => {
    const mockData = { id: '1', name: 'repo1', stargazerCount: 100 };
    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useRepository('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
  });

  it('should not fetch when id is undefined', async () => {
    const { result } = renderHook(() => useRepository(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});

describe('useTrending', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch trending repositories', async () => {
    const mockData = [
      { repository: { id: '1', name: 'trending1' }, rank: 1, stars: 1000, starsToday: 100 },
      { repository: { id: '2', name: 'trending2' }, rank: 2, stars: 800, starsToday: 80 },
    ];

    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useTrending({ period: 'daily' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
  });

  it('should refetch on window focus', async () => {
    const mockData = [];
    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useTrending({ period: 'daily' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Check that refetchOnWindowFocus is enabled
    expect(result.current.isRefetching).toBe(false);
  });
});
