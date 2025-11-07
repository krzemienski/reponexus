/**
 * Cache Manager Service
 *
 * Provides utilities for managing TanStack Query cache,
 * including invalidation, prefetching, and warming strategies.
 */

import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/api/queryKeys';
import type { TrendingPeriod } from '@/types/models';

/**
 * Cache Manager
 */
class CacheManager {
  private queryClient: QueryClient | null = null;

  /**
   * Initialize the cache manager with a QueryClient instance
   */
  initialize(queryClient: QueryClient) {
    this.queryClient = queryClient;

    if (__DEV__) {
      console.log('[CacheManager] Initialized');
    }
  }

  /**
   * Get the QueryClient instance
   */
  private getClient(): QueryClient {
    if (!this.queryClient) {
      throw new Error('CacheManager not initialized. Call initialize() first.');
    }
    return this.queryClient;
  }

  /**
   * Clear all cache
   */
  async clearAll() {
    const client = this.getClient();
    await client.clear();

    if (__DEV__) {
      console.log('[CacheManager] Cleared all cache');
    }
  }

  /**
   * Clear cache for repositories
   */
  async clearRepositories() {
    const client = this.getClient();
    await client.invalidateQueries({ queryKey: queryKeys.repositories.all });

    if (__DEV__) {
      console.log('[CacheManager] Cleared repository cache');
    }
  }

  /**
   * Clear cache for topics
   */
  async clearTopics() {
    const client = this.getClient();
    await client.invalidateQueries({ queryKey: queryKeys.topics.all });

    if (__DEV__) {
      console.log('[CacheManager] Cleared topic cache');
    }
  }

  /**
   * Clear cache for user data
   */
  async clearUserData() {
    const client = this.getClient();
    await client.invalidateQueries({ queryKey: queryKeys.users.all });

    if (__DEV__) {
      console.log('[CacheManager] Cleared user cache');
    }
  }

  /**
   * Clear search cache
   */
  async clearSearchCache() {
    const client = this.getClient();
    await client.invalidateQueries({ queryKey: queryKeys.search.all });

    if (__DEV__) {
      console.log('[CacheManager] Cleared search cache');
    }
  }

  /**
   * Invalidate specific repository
   */
  async invalidateRepository(id: string) {
    const client = this.getClient();
    await client.invalidateQueries({ queryKey: queryKeys.repositories.detail(id) });

    if (__DEV__) {
      console.log('[CacheManager] Invalidated repository:', id);
    }
  }

  /**
   * Invalidate specific topic
   */
  async invalidateTopic(name: string) {
    const client = this.getClient();
    await client.invalidateQueries({ queryKey: queryKeys.topics.detail(name) });

    if (__DEV__) {
      console.log('[CacheManager] Invalidated topic:', name);
    }
  }

  /**
   * Invalidate trending data
   */
  async invalidateTrending() {
    const client = this.getClient();
    await client.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey as string[];
        return key[0] === 'repositories' && key[1] === 'trending';
      },
    });

    if (__DEV__) {
      console.log('[CacheManager] Invalidated trending cache');
    }
  }

  /**
   * Remove specific query from cache
   */
  async removeQuery(queryKey: any[]) {
    const client = this.getClient();
    await client.removeQueries({ queryKey });

    if (__DEV__) {
      console.log('[CacheManager] Removed query:', queryKey);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const client = this.getClient();
    const cache = client.getQueryCache();
    const queries = cache.getAll();

    const stats = {
      totalQueries: queries.length,
      activeQueries: queries.filter((q) => q.getObserversCount() > 0).length,
      staleQueries: queries.filter((q) => q.isStale()).length,
      fetchingQueries: queries.filter((q) => q.state.fetchStatus === 'fetching').length,
      errorQueries: queries.filter((q) => q.state.status === 'error').length,
    };

    return stats;
  }

  /**
   * Get queries by type
   */
  getQueriesByType(type: 'repositories' | 'topics' | 'users' | 'search') {
    const client = this.getClient();
    const cache = client.getQueryCache();
    const queries = cache.getAll();

    return queries.filter((query) => {
      const key = query.queryKey as string[];
      return key[0] === type;
    });
  }

  /**
   * Log cache state (for debugging)
   */
  logCacheState() {
    if (!__DEV__) return;

    const stats = this.getCacheStats();
    console.log('[CacheManager] Cache Stats:', stats);

    const client = this.getClient();
    const cache = client.getQueryCache();
    const queries = cache.getAll();

    console.log('[CacheManager] Query Keys:');
    queries.forEach((query) => {
      console.log(
        '  -',
        query.queryKey,
        '|',
        query.state.status,
        '|',
        'observers:',
        query.getObserversCount()
      );
    });
  }

  /**
   * Warm cache with essential data
   */
  async warmCache() {
    if (__DEV__) {
      console.log('[CacheManager] Warming cache...');
    }

    const client = this.getClient();

    // Prefetch trending repositories
    const periods: TrendingPeriod[] = ['daily', 'weekly', 'monthly'];
    await Promise.allSettled(
      periods.map((period) =>
        client.prefetchQuery({
          queryKey: queryKeys.repositories.trending(period),
          staleTime: 1000 * 60 * 10, // 10 minutes
        })
      )
    );

    // Prefetch user topics
    try {
      await client.prefetchQuery({
        queryKey: queryKeys.users.topics(),
        staleTime: 1000 * 60 * 5, // 5 minutes
      });
    } catch (error) {
      // User might not be authenticated, ignore error
      if (__DEV__) {
        console.log('[CacheManager] Could not prefetch user topics (user may not be authenticated)');
      }
    }

    if (__DEV__) {
      console.log('[CacheManager] Cache warmed');
    }
  }

  /**
   * Cleanup stale queries
   */
  async cleanupStaleQueries() {
    const client = this.getClient();
    const cache = client.getQueryCache();
    const queries = cache.getAll();

    const staleQueries = queries.filter(
      (q) => q.isStale() && q.getObserversCount() === 0
    );

    if (__DEV__) {
      console.log('[CacheManager] Cleaning up', staleQueries.length, 'stale queries');
    }

    staleQueries.forEach((query) => {
      cache.remove(query);
    });
  }

  /**
   * Set default options for specific query types
   */
  setQueryDefaults(queryKey: any[], options: any) {
    const client = this.getClient();
    client.setQueryDefaults(queryKey, options);

    if (__DEV__) {
      console.log('[CacheManager] Set defaults for:', queryKey);
    }
  }

  /**
   * Cancel all queries
   */
  async cancelQueries() {
    const client = this.getClient();
    await client.cancelQueries();

    if (__DEV__) {
      console.log('[CacheManager] Cancelled all queries');
    }
  }

  /**
   * Cancel queries by type
   */
  async cancelQueriesByType(type: 'repositories' | 'topics' | 'users' | 'search') {
    const client = this.getClient();
    await client.cancelQueries({
      predicate: (query) => {
        const key = query.queryKey as string[];
        return key[0] === type;
      },
    });

    if (__DEV__) {
      console.log('[CacheManager] Cancelled', type, 'queries');
    }
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();
