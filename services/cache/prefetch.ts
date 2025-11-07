/**
 * Prefetch Utilities
 *
 * Provides utilities for prefetching data to improve UX.
 * Includes strategies for navigation-based prefetching and predictive loading.
 */

import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/api/queryKeys';
import apiClient from '@/services/api/client';
import { API_ENDPOINTS } from '@/utils/constants';
import type { Repository, Topic, TrendingItem, TrendingPeriod, User } from '@/types/models';

/**
 * Prefetch Manager
 */
class PrefetchManager {
  private queryClient: QueryClient | null = null;

  /**
   * Initialize the prefetch manager
   */
  initialize(queryClient: QueryClient) {
    this.queryClient = queryClient;

    if (__DEV__) {
      console.log('[PrefetchManager] Initialized');
    }
  }

  /**
   * Get the QueryClient instance
   */
  private getClient(): QueryClient {
    if (!this.queryClient) {
      throw new Error('PrefetchManager not initialized. Call initialize() first.');
    }
    return this.queryClient;
  }

  /**
   * Prefetch a repository by ID
   */
  async prefetchRepository(id: string) {
    const client = this.getClient();

    await client.prefetchQuery({
      queryKey: queryKeys.repositories.detail(id),
      queryFn: async () => {
        const response = await apiClient.get<Repository>(API_ENDPOINTS.REPOSITORY(id));
        return response.data;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    });

    if (__DEV__) {
      console.log('[PrefetchManager] Prefetched repository:', id);
    }
  }

  /**
   * Prefetch a topic by name
   */
  async prefetchTopic(name: string) {
    const client = this.getClient();

    await client.prefetchQuery({
      queryKey: queryKeys.topics.detail(name),
      queryFn: async () => {
        const response = await apiClient.get<Topic>(API_ENDPOINTS.TOPIC_BY_NAME(name));
        return response.data;
      },
      staleTime: 1000 * 60 * 10, // 10 minutes
    });

    if (__DEV__) {
      console.log('[PrefetchManager] Prefetched topic:', name);
    }
  }

  /**
   * Prefetch trending repositories
   */
  async prefetchTrending(period: TrendingPeriod = 'daily', language?: string) {
    const client = this.getClient();

    await client.prefetchQuery({
      queryKey: queryKeys.repositories.trending(period, language),
      queryFn: async () => {
        const response = await apiClient.get<TrendingItem[]>(API_ENDPOINTS.TRENDING, {
          params: { period, language },
        });
        return response.data;
      },
      staleTime: 1000 * 60 * 10, // 10 minutes
    });

    if (__DEV__) {
      console.log('[PrefetchManager] Prefetched trending:', period, language);
    }
  }

  /**
   * Prefetch all trending periods
   */
  async prefetchAllTrending() {
    const periods: TrendingPeriod[] = ['daily', 'weekly', 'monthly'];

    await Promise.allSettled(
      periods.map((period) => this.prefetchTrending(period))
    );

    if (__DEV__) {
      console.log('[PrefetchManager] Prefetched all trending periods');
    }
  }

  /**
   * Prefetch user's followed topics
   */
  async prefetchUserTopics() {
    const client = this.getClient();

    try {
      await client.prefetchQuery({
        queryKey: queryKeys.users.topics(),
        queryFn: async () => {
          const response = await apiClient.get<Topic[]>(API_ENDPOINTS.USER_TOPICS);
          return response.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
      });

      if (__DEV__) {
        console.log('[PrefetchManager] Prefetched user topics');
      }
    } catch (error) {
      // User might not be authenticated, ignore error
      if (__DEV__) {
        console.log('[PrefetchManager] Could not prefetch user topics:', error);
      }
    }
  }

  /**
   * Prefetch user's starred repositories
   */
  async prefetchStarredRepositories() {
    const client = this.getClient();

    try {
      await client.prefetchQuery({
        queryKey: queryKeys.users.starred(),
        queryFn: async () => {
          const response = await apiClient.get(API_ENDPOINTS.USER_STARRED);
          return response.data;
        },
        staleTime: 1000 * 60 * 3, // 3 minutes
      });

      if (__DEV__) {
        console.log('[PrefetchManager] Prefetched starred repositories');
      }
    } catch (error) {
      if (__DEV__) {
        console.log('[PrefetchManager] Could not prefetch starred repositories:', error);
      }
    }
  }

  /**
   * Prefetch current user data
   */
  async prefetchCurrentUser() {
    const client = this.getClient();

    try {
      await client.prefetchQuery({
        queryKey: queryKeys.users.current(),
        queryFn: async () => {
          const response = await apiClient.get<User>(API_ENDPOINTS.USER_ME);
          return response.data;
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
      });

      if (__DEV__) {
        console.log('[PrefetchManager] Prefetched current user');
      }
    } catch (error) {
      if (__DEV__) {
        console.log('[PrefetchManager] Could not prefetch current user:', error);
      }
    }
  }

  /**
   * Prefetch repository README
   */
  async prefetchRepositoryReadme(id: string) {
    const client = this.getClient();

    await client.prefetchQuery({
      queryKey: queryKeys.repositories.readme(id),
      queryFn: async () => {
        const response = await apiClient.get<{ content: string }>(API_ENDPOINTS.README(id));
        return response.data.content;
      },
      staleTime: 1000 * 60 * 10, // 10 minutes
    });

    if (__DEV__) {
      console.log('[PrefetchManager] Prefetched README for:', id);
    }
  }

  /**
   * Prefetch topic repositories
   */
  async prefetchTopicRepositories(name: string) {
    const client = this.getClient();

    await client.prefetchQuery({
      queryKey: queryKeys.topics.repositories(name),
      queryFn: async () => {
        const response = await apiClient.get(API_ENDPOINTS.TOPIC_REPOSITORIES(name));
        return response.data;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    });

    if (__DEV__) {
      console.log('[PrefetchManager] Prefetched repositories for topic:', name);
    }
  }

  /**
   * Prefetch on app open
   * This is called when the app starts to warm the cache
   */
  async prefetchOnAppOpen() {
    if (__DEV__) {
      console.log('[PrefetchManager] Prefetching on app open...');
    }

    await Promise.allSettled([
      this.prefetchTrending('daily'),
      this.prefetchCurrentUser(),
      this.prefetchUserTopics(),
    ]);

    if (__DEV__) {
      console.log('[PrefetchManager] App open prefetch complete');
    }
  }

  /**
   * Prefetch for explore tab
   */
  async prefetchExploreTab() {
    if (__DEV__) {
      console.log('[PrefetchManager] Prefetching explore tab...');
    }

    await Promise.allSettled([
      this.prefetchTrending('daily'),
      this.prefetchUserTopics(),
    ]);

    if (__DEV__) {
      console.log('[PrefetchManager] Explore tab prefetch complete');
    }
  }

  /**
   * Prefetch for trending tab
   */
  async prefetchTrendingTab() {
    if (__DEV__) {
      console.log('[PrefetchManager] Prefetching trending tab...');
    }

    await this.prefetchAllTrending();

    if (__DEV__) {
      console.log('[PrefetchManager] Trending tab prefetch complete');
    }
  }

  /**
   * Prefetch for topics tab
   */
  async prefetchTopicsTab() {
    if (__DEV__) {
      console.log('[PrefetchManager] Prefetching topics tab...');
    }

    await this.prefetchUserTopics();

    if (__DEV__) {
      console.log('[PrefetchManager] Topics tab prefetch complete');
    }
  }

  /**
   * Prefetch for profile tab
   */
  async prefetchProfileTab() {
    if (__DEV__) {
      console.log('[PrefetchManager] Prefetching profile tab...');
    }

    await Promise.allSettled([
      this.prefetchCurrentUser(),
      this.prefetchStarredRepositories(),
      this.prefetchUserTopics(),
    ]);

    if (__DEV__) {
      console.log('[PrefetchManager] Profile tab prefetch complete');
    }
  }

  /**
   * Prefetch on navigation to repository detail
   */
  async prefetchRepositoryDetail(id: string) {
    if (__DEV__) {
      console.log('[PrefetchManager] Prefetching repository detail...');
    }

    await Promise.allSettled([
      this.prefetchRepository(id),
      this.prefetchRepositoryReadme(id),
    ]);

    if (__DEV__) {
      console.log('[PrefetchManager] Repository detail prefetch complete');
    }
  }

  /**
   * Prefetch on navigation to topic detail
   */
  async prefetchTopicDetail(name: string) {
    if (__DEV__) {
      console.log('[PrefetchManager] Prefetching topic detail...');
    }

    await Promise.allSettled([
      this.prefetchTopic(name),
      this.prefetchTopicRepositories(name),
    ]);

    if (__DEV__) {
      console.log('[PrefetchManager] Topic detail prefetch complete');
    }
  }
}

// Export singleton instance
export const prefetchManager = new PrefetchManager();
