/**
 * Tests for Cache Manager Service
 */

import { QueryClient } from '@tanstack/react-query';
import { cacheManager } from '@/services/cache/cacheManager';
import { queryKeys } from '@/services/api/queryKeys';

describe('CacheManager', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    cacheManager.initialize(queryClient);
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('initialize', () => {
    it('should initialize with a QueryClient', () => {
      expect(() => cacheManager.getCacheStats()).not.toThrow();
    });
  });

  describe('clearAll', () => {
    it('should clear all cache', async () => {
      // Add some data to cache
      queryClient.setQueryData(queryKeys.repositories.detail('1'), { id: '1', name: 'test' });

      expect(queryClient.getQueryData(queryKeys.repositories.detail('1'))).toBeDefined();

      await cacheManager.clearAll();

      expect(queryClient.getQueryData(queryKeys.repositories.detail('1'))).toBeUndefined();
    });
  });

  describe('invalidateRepository', () => {
    it('should invalidate specific repository', async () => {
      queryClient.setQueryData(queryKeys.repositories.detail('1'), { id: '1', name: 'test' });

      await cacheManager.invalidateRepository('1');

      // Check that the query was invalidated
      const queries = queryClient.getQueryCache().getAll();
      const query = queries.find(
        (q) => JSON.stringify(q.queryKey) === JSON.stringify(queryKeys.repositories.detail('1'))
      );

      expect(query?.isStale()).toBe(true);
    });
  });

  describe('invalidateTopic', () => {
    it('should invalidate specific topic', async () => {
      queryClient.setQueryData(queryKeys.topics.detail('react'), { name: 'react' });

      await cacheManager.invalidateTopic('react');

      const queries = queryClient.getQueryCache().getAll();
      const query = queries.find(
        (q) => JSON.stringify(q.queryKey) === JSON.stringify(queryKeys.topics.detail('react'))
      );

      expect(query?.isStale()).toBe(true);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      // Add some queries
      queryClient.setQueryData(queryKeys.repositories.detail('1'), { id: '1' });
      queryClient.setQueryData(queryKeys.topics.detail('react'), { name: 'react' });

      const stats = cacheManager.getCacheStats();

      expect(stats).toHaveProperty('totalQueries');
      expect(stats).toHaveProperty('activeQueries');
      expect(stats).toHaveProperty('staleQueries');
      expect(stats).toHaveProperty('fetchingQueries');
      expect(stats).toHaveProperty('errorQueries');

      expect(stats.totalQueries).toBeGreaterThan(0);
    });
  });

  describe('getQueriesByType', () => {
    it('should return queries of specific type', () => {
      queryClient.setQueryData(queryKeys.repositories.detail('1'), { id: '1' });
      queryClient.setQueryData(queryKeys.topics.detail('react'), { name: 'react' });

      const repoQueries = cacheManager.getQueriesByType('repositories');
      const topicQueries = cacheManager.getQueriesByType('topics');

      expect(repoQueries.length).toBeGreaterThan(0);
      expect(topicQueries.length).toBeGreaterThan(0);
    });
  });

  describe('removeQuery', () => {
    it('should remove specific query', async () => {
      const queryKey = queryKeys.repositories.detail('1');
      queryClient.setQueryData(queryKey, { id: '1' });

      expect(queryClient.getQueryData(queryKey)).toBeDefined();

      await cacheManager.removeQuery(queryKey);

      expect(queryClient.getQueryData(queryKey)).toBeUndefined();
    });
  });
});
