/**
 * Tests for Offline Queue Service
 */

import { offlineQueue, QueuedMutation } from '@/services/offline/offlineQueue';
import { MMKVStorage } from '@/services/storage/mmkv';

// Mock MMKV storage
jest.mock('@/services/storage/mmkv', () => ({
  MMKVStorage: {
    getString: jest.fn(),
    setString: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('OfflineQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    offlineQueue.clear();
  });

  describe('add', () => {
    it('should add mutation to queue', () => {
      const mutation = {
        endpoint: '/api/test',
        method: 'POST' as const,
        data: { test: true },
        maxRetries: 3,
      };

      const id = offlineQueue.add(mutation);

      expect(id).toBeDefined();
      expect(offlineQueue.size()).toBe(1);
      expect(MMKVStorage.setString).toHaveBeenCalled();
    });

    it('should generate unique IDs', () => {
      const mutation = {
        endpoint: '/api/test',
        method: 'POST' as const,
        maxRetries: 3,
      };

      const id1 = offlineQueue.add(mutation);
      const id2 = offlineQueue.add(mutation);

      expect(id1).not.toBe(id2);
    });
  });

  describe('remove', () => {
    it('should remove mutation from queue', () => {
      const mutation = {
        endpoint: '/api/test',
        method: 'POST' as const,
        maxRetries: 3,
      };

      const id = offlineQueue.add(mutation);
      expect(offlineQueue.size()).toBe(1);

      offlineQueue.remove(id);
      expect(offlineQueue.size()).toBe(0);
    });
  });

  describe('getAll', () => {
    it('should return all queued mutations', () => {
      const mutation1 = {
        endpoint: '/api/test1',
        method: 'POST' as const,
        maxRetries: 3,
      };

      const mutation2 = {
        endpoint: '/api/test2',
        method: 'PUT' as const,
        maxRetries: 3,
      };

      offlineQueue.add(mutation1);
      offlineQueue.add(mutation2);

      const all = offlineQueue.getAll();
      expect(all).toHaveLength(2);
    });
  });

  describe('clear', () => {
    it('should clear all mutations', () => {
      offlineQueue.add({
        endpoint: '/api/test',
        method: 'POST' as const,
        maxRetries: 3,
      });

      expect(offlineQueue.size()).toBe(1);

      offlineQueue.clear();
      expect(offlineQueue.size()).toBe(0);
    });
  });

  describe('process', () => {
    it('should process all queued mutations', async () => {
      const executor = jest.fn().mockResolvedValue(undefined);

      offlineQueue.add({
        endpoint: '/api/test1',
        method: 'POST' as const,
        maxRetries: 3,
      });

      offlineQueue.add({
        endpoint: '/api/test2',
        method: 'POST' as const,
        maxRetries: 3,
      });

      await offlineQueue.process(executor);

      expect(executor).toHaveBeenCalledTimes(2);
      expect(offlineQueue.size()).toBe(0);
    });

    it('should handle failures with retry', async () => {
      const executor = jest.fn().mockRejectedValue(new Error('Failed'));

      const id = offlineQueue.add({
        endpoint: '/api/test',
        method: 'POST' as const,
        maxRetries: 3,
      });

      await offlineQueue.process(executor);

      // Should still be in queue after failure
      const mutations = offlineQueue.getAll();
      expect(mutations).toHaveLength(1);
      expect(mutations[0].retryCount).toBe(1);
    });

    it('should remove mutation after max retries', async () => {
      const executor = jest.fn().mockRejectedValue(new Error('Failed'));

      offlineQueue.add({
        endpoint: '/api/test',
        method: 'POST' as const,
        maxRetries: 1,
      });

      await offlineQueue.process(executor);

      // Should be removed after reaching max retries
      expect(offlineQueue.size()).toBe(0);
    });
  });

  describe('getFailedMutations', () => {
    it('should return only failed mutations', async () => {
      const executor = jest.fn().mockRejectedValue(new Error('Failed'));

      offlineQueue.add({
        endpoint: '/api/test',
        method: 'POST' as const,
        maxRetries: 3,
      });

      await offlineQueue.process(executor);

      const failed = offlineQueue.getFailedMutations();
      expect(failed).toHaveLength(1);
      expect(failed[0].retryCount).toBeGreaterThan(0);
    });
  });
});
