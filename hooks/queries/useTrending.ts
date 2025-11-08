/**
 * TanStack Query hooks for trending repositories
 * Fetches trending repos from user's followed topics with caching and auto-refresh
 */
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Repository, PaginatedResponse, TrendingTimeWindow } from '@/types/models';

// Extended repository type with trending information
export interface TrendingRepository extends Repository {
  trending_score?: number;
  star_growth_rate?: number;
  activity_score?: number;
  community_score?: number;
  recency_score?: number;
  quality_score?: number;
  trending_time_window?: string;
  trending_calculated_at?: string;
}

export interface TrendingConfig {
  time_windows: Array<{
    value: string;
    label: string;
    description: string;
  }>;
  default_window: string;
  cache_ttl: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface TrendingStats {
  topics_processed: number;
  repositories_scored: number;
  last_calculation: string | null;
  cache_status: {
    daily_ttl: number;
    weekly_ttl: number;
    monthly_ttl: number;
  };
}

/**
 * Hook to fetch trending repositories from user's followed topics
 *
 * @param timeWindow - Time window: 'daily', 'weekly', or 'monthly'
 * @param topicFilter - Optional topic ID to filter by
 * @param page - Page number for pagination
 * @param perPage - Number of results per page
 * @returns Query result with trending repositories
 */
export function useTrendingRepositories({
  timeWindow = 'daily',
  topicFilter,
  page = 1,
  perPage = 20,
}: {
  timeWindow?: TrendingTimeWindow;
  topicFilter?: string;
  page?: number;
  perPage?: number;
} = {}): UseQueryResult<PaginatedResponse<TrendingRepository>> {
  return useQuery({
    queryKey: ['trending', 'repositories', timeWindow, topicFilter, page, perPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        time_window: timeWindow,
        page: page.toString(),
        per_page: perPage.toString(),
      });

      if (topicFilter) {
        params.append('topic_filter', topicFilter);
      }

      const response = await api.get<PaginatedResponse<TrendingRepository>>(
        `/explore/trending?${params.toString()}`
      );

      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch featured repositories (globally trending)
 *
 * @param page - Page number for pagination
 * @param perPage - Number of results per page
 * @returns Query result with featured repositories
 */
export function useFeaturedRepositories({
  page = 1,
  perPage = 20,
}: {
  page?: number;
  perPage?: number;
} = {}): UseQueryResult<PaginatedResponse<TrendingRepository>> {
  return useQuery({
    queryKey: ['featured', 'repositories', page, perPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });

      const response = await api.get<PaginatedResponse<TrendingRepository>>(
        `/explore/featured?${params.toString()}`
      );

      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 10 * 60 * 1000, // Auto-refresh every 10 minutes
  });
}

/**
 * Hook to fetch trending configuration
 * Returns available time windows and cache settings
 */
export function useTrendingConfig(): UseQueryResult<TrendingConfig> {
  return useQuery({
    queryKey: ['trending', 'config'],
    queryFn: async () => {
      const response = await api.get<TrendingConfig>('/explore/trending/config');
      return response.data;
    },
    staleTime: Infinity, // Config rarely changes
  });
}

/**
 * Hook to fetch trending statistics
 * Returns information about trending calculations
 */
export function useTrendingStats(): UseQueryResult<TrendingStats> {
  return useQuery({
    queryKey: ['trending', 'stats'],
    queryFn: async () => {
      const response = await api.get<TrendingStats>('/explore/trending/stats');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Helper function to get trending score color
 * Returns color based on trending score value
 */
export function getTrendingScoreColor(score: number | undefined): string {
  if (!score) return 'gray';
  if (score >= 80) return 'red';
  if (score >= 60) return 'orange';
  if (score >= 40) return 'yellow';
  return 'gray';
}

/**
 * Helper function to format trending score
 * Returns formatted score string
 */
export function formatTrendingScore(score: number | undefined): string {
  if (!score) return 'N/A';
  return score.toFixed(1);
}
