import { renderHook, waitFor } from '@testing-library/react-native';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  useRepositories,
  useRepository,
  useTrending,
  useInfiniteRepositories,
  useIsRepositoryStarred,
} from '@/hooks/queries/useRepositories';

// Mock TanStack Query
jest.mock('@tanstack/react-query');

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseInfiniteQuery = useInfiniteQuery as jest.MockedFunction<
  typeof useInfiniteQuery
>;

describe('useRepositories Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useRepositories', () => {
    it('should fetch repositories successfully', async () => {
      const mockData = {
        data: [
          {
            id: '1',
            name: 'test-repo',
            ownerLogin: 'testuser',
            description: 'Test repository',
            stargazerCount: 100,
            forkCount: 10,
            openIssuesCount: 5,
            primaryLanguage: 'TypeScript',
            topics: ['react', 'typescript'],
          },
        ],
        pagination: {
          page: 1,
          pages: 1,
          total: 1,
          perPage: 20,
        },
      };

      mockUseQuery.mockReturnValue({
        data: mockData,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const { result } = renderHook(() => useRepositories());

      expect(result.current.data).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle loading state', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const { result } = renderHook(() => useRepositories());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('should handle error state', () => {
      const mockError = {
        message: 'Failed to fetch repositories',
        status: 500,
      };

      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: mockError,
        refetch: jest.fn(),
      } as any);

      const { result } = renderHook(() => useRepositories());

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useInfiniteRepositories', () => {
    it('should handle pagination correctly', () => {
      const mockData = {
        pages: [
          {
            data: [{ id: '1', name: 'repo-1' }],
            pagination: { page: 1, pages: 2, total: 30, perPage: 20 },
          },
        ],
        pageParams: [1],
      };

      mockUseInfiniteQuery.mockReturnValue({
        data: mockData,
        isLoading: false,
        isError: false,
        error: null,
        fetchNextPage: jest.fn(),
        hasNextPage: true,
        isFetchingNextPage: false,
      } as any);

      const { result } = renderHook(() => useInfiniteRepositories());

      expect(result.current.data).toEqual(mockData);
      expect(result.current.hasNextPage).toBe(true);
    });
  });

  describe('useTrending', () => {
    it('should fetch trending repositories', () => {
      const mockTrendingData = [
        {
          rank: 1,
          repository: {
            id: '1',
            name: 'trending-repo',
            ownerLogin: 'testuser',
            stargazerCount: 1000,
          },
        },
      ];

      mockUseQuery.mockReturnValue({
        data: mockTrendingData,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const { result } = renderHook(() =>
        useTrending({ period: 'daily', language: 'TypeScript' })
      );

      expect(result.current.data).toEqual(mockTrendingData);
    });
  });

  describe('cache invalidation', () => {
    it('should support cache invalidation via refetch', () => {
      const mockRefetch = jest.fn();

      mockUseQuery.mockReturnValue({
        data: { data: [], pagination: { page: 1, pages: 1, total: 0, perPage: 20 } },
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      } as any);

      const { result } = renderHook(() => useRepositories());

      result.current.refetch();

      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
