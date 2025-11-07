/**
 * Offline Queue Service
 *
 * Manages offline mutations by queuing them and retrying when connection is restored.
 * Uses MMKV for persistent storage.
 */

import { MMKVStorage } from '@/services/storage/mmkv';

// Queue item types
export interface QueuedMutation {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

const QUEUE_KEY = 'offline_mutation_queue';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Offline Queue Manager
 */
class OfflineQueueManager {
  private queue: QueuedMutation[] = [];
  private isProcessing = false;

  constructor() {
    this.loadQueue();
  }

  /**
   * Load queue from storage
   */
  private loadQueue() {
    try {
      const stored = MMKVStorage.getString(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }
  }

  /**
   * Save queue to storage
   */
  private saveQueue() {
    try {
      MMKVStorage.setString(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Add a mutation to the queue
   */
  add(mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'retryCount'>) {
    const queuedMutation: QueuedMutation = {
      ...mutation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: mutation.maxRetries || MAX_RETRIES,
    };

    this.queue.push(queuedMutation);
    this.saveQueue();

    if (__DEV__) {
      console.log('[OfflineQueue] Added mutation:', queuedMutation.id);
    }

    return queuedMutation.id;
  }

  /**
   * Remove a mutation from the queue
   */
  remove(id: string) {
    const index = this.queue.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.saveQueue();

      if (__DEV__) {
        console.log('[OfflineQueue] Removed mutation:', id);
      }
    }
  }

  /**
   * Get all queued mutations
   */
  getAll(): QueuedMutation[] {
    return [...this.queue];
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Clear the entire queue
   */
  clear() {
    this.queue = [];
    this.saveQueue();

    if (__DEV__) {
      console.log('[OfflineQueue] Cleared all mutations');
    }
  }

  /**
   * Process the queue
   * This should be called when the app comes online
   */
  async process(executor: (mutation: QueuedMutation) => Promise<void>) {
    if (this.isProcessing) {
      if (__DEV__) {
        console.log('[OfflineQueue] Already processing queue');
      }
      return;
    }

    if (this.queue.length === 0) {
      if (__DEV__) {
        console.log('[OfflineQueue] Queue is empty');
      }
      return;
    }

    this.isProcessing = true;

    if (__DEV__) {
      console.log('[OfflineQueue] Processing queue:', this.queue.length, 'items');
    }

    // Process mutations sequentially
    const mutations = [...this.queue];
    for (const mutation of mutations) {
      try {
        await executor(mutation);
        this.remove(mutation.id);

        if (__DEV__) {
          console.log('[OfflineQueue] Successfully processed:', mutation.id);
        }
      } catch (error) {
        console.error('[OfflineQueue] Failed to process mutation:', mutation.id, error);

        // Increment retry count
        const index = this.queue.findIndex((item) => item.id === mutation.id);
        if (index !== -1) {
          this.queue[index].retryCount++;

          // Remove if max retries reached
          if (this.queue[index].retryCount >= this.queue[index].maxRetries) {
            if (__DEV__) {
              console.log('[OfflineQueue] Max retries reached, removing:', mutation.id);
            }
            this.remove(mutation.id);
          } else {
            this.saveQueue();

            // Wait before next retry
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          }
        }
      }
    }

    this.isProcessing = false;

    if (__DEV__) {
      console.log('[OfflineQueue] Queue processing complete');
    }
  }

  /**
   * Check if queue is currently being processed
   */
  isQueueProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Get mutations that have failed
   */
  getFailedMutations(): QueuedMutation[] {
    return this.queue.filter((item) => item.retryCount > 0);
  }

  /**
   * Retry a specific mutation
   */
  async retryMutation(id: string, executor: (mutation: QueuedMutation) => Promise<void>) {
    const mutation = this.queue.find((item) => item.id === id);
    if (!mutation) {
      throw new Error('Mutation not found in queue');
    }

    try {
      await executor(mutation);
      this.remove(mutation.id);
    } catch (error) {
      mutation.retryCount++;
      if (mutation.retryCount >= mutation.maxRetries) {
        this.remove(mutation.id);
      } else {
        this.saveQueue();
      }
      throw error;
    }
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueueManager();
