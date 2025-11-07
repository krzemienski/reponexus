/**
 * Sync Service
 *
 * Manages online/offline state detection and triggers data synchronization.
 * Coordinates between offline queue and query cache.
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { QueryClient } from '@tanstack/react-query';
import { offlineQueue, QueuedMutation } from './offlineQueue';
import apiClient from '@/services/api/client';

type NetworkStatus = 'online' | 'offline' | 'unknown';

/**
 * Sync Service Manager
 */
class SyncServiceManager {
  private networkStatus: NetworkStatus = 'unknown';
  private queryClient: QueryClient | null = null;
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private unsubscribeNetInfo?: (() => void) | null = null;

  /**
   * Initialize the sync service
   */
  initialize(queryClient: QueryClient) {
    this.queryClient = queryClient;

    // Subscribe to network state changes
    this.unsubscribeNetInfo = NetInfo.addEventListener(this.handleNetworkStateChange);

    // Check initial network state
    NetInfo.fetch().then(this.handleNetworkStateChange);

    if (__DEV__) {
      console.log('[SyncService] Initialized');
    }
  }

  /**
   * Cleanup the sync service
   */
  cleanup() {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }

    this.listeners.clear();

    if (__DEV__) {
      console.log('[SyncService] Cleaned up');
    }
  }

  /**
   * Handle network state changes
   */
  private handleNetworkStateChange = (state: NetInfoState) => {
    const wasOffline = this.networkStatus === 'offline';
    const isConnected = state.isConnected && state.isInternetReachable;

    // Update network status
    this.networkStatus = isConnected ? 'online' : 'offline';

    if (__DEV__) {
      console.log('[SyncService] Network status:', this.networkStatus);
    }

    // Notify listeners
    this.notifyListeners(this.networkStatus);

    // If we just came back online, trigger sync
    if (wasOffline && this.networkStatus === 'online') {
      this.triggerSync();
    }
  };

  /**
   * Trigger data synchronization
   */
  private async triggerSync() {
    if (!this.queryClient) {
      console.warn('[SyncService] QueryClient not initialized');
      return;
    }

    if (__DEV__) {
      console.log('[SyncService] Triggering sync');
    }

    try {
      // Process offline queue first
      await this.processOfflineQueue();

      // Then refetch stale queries
      await this.refetchStaleQueries();

      if (__DEV__) {
        console.log('[SyncService] Sync completed successfully');
      }
    } catch (error) {
      console.error('[SyncService] Sync failed:', error);
    }
  }

  /**
   * Process offline mutation queue
   */
  private async processOfflineQueue() {
    const queueSize = offlineQueue.size();
    if (queueSize === 0) {
      if (__DEV__) {
        console.log('[SyncService] No offline mutations to process');
      }
      return;
    }

    if (__DEV__) {
      console.log('[SyncService] Processing', queueSize, 'offline mutations');
    }

    await offlineQueue.process(async (mutation: QueuedMutation) => {
      // Execute the mutation
      await this.executeMutation(mutation);
    });
  }

  /**
   * Execute a queued mutation
   */
  private async executeMutation(mutation: QueuedMutation) {
    const { endpoint, method, data } = mutation;

    switch (method) {
      case 'GET':
        await apiClient.get(endpoint);
        break;
      case 'POST':
        await apiClient.post(endpoint, data);
        break;
      case 'PUT':
        await apiClient.put(endpoint, data);
        break;
      case 'PATCH':
        await apiClient.patch(endpoint, data);
        break;
      case 'DELETE':
        await apiClient.delete(endpoint);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  /**
   * Refetch stale queries
   */
  private async refetchStaleQueries() {
    if (!this.queryClient) return;

    if (__DEV__) {
      console.log('[SyncService] Refetching stale queries');
    }

    // Refetch all stale queries
    await this.queryClient.refetchQueries({
      type: 'active',
      stale: true,
    });

    // Invalidate queries that should be refreshed
    await this.queryClient.invalidateQueries({
      predicate: (query) => {
        const queryKey = query.queryKey as string[];

        // Always refetch trending data
        if (queryKey.includes('trending')) {
          return true;
        }

        // Refetch user data
        if (queryKey[0] === 'users' && queryKey.includes('current')) {
          return true;
        }

        return false;
      },
    });
  }

  /**
   * Get current network status
   */
  getNetworkStatus(): NetworkStatus {
    return this.networkStatus;
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return this.networkStatus === 'online';
  }

  /**
   * Check if offline
   */
  isOffline(): boolean {
    return this.networkStatus === 'offline';
  }

  /**
   * Add a listener for network status changes
   */
  addListener(listener: (status: NetworkStatus) => void) {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of network status change
   */
  private notifyListeners(status: NetworkStatus) {
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        console.error('[SyncService] Error in listener:', error);
      }
    });
  }

  /**
   * Manually trigger a sync
   */
  async sync() {
    if (this.isOffline()) {
      if (__DEV__) {
        console.log('[SyncService] Cannot sync while offline');
      }
      return;
    }

    await this.triggerSync();
  }

  /**
   * Get sync statistics
   */
  getSyncStats() {
    return {
      networkStatus: this.networkStatus,
      queuedMutations: offlineQueue.size(),
      failedMutations: offlineQueue.getFailedMutations().length,
    };
  }
}

// Export singleton instance
export const syncService = new SyncServiceManager();

/**
 * React hook for network status
 */
export function useNetworkStatus() {
  const [status, setStatus] = React.useState<NetworkStatus>(
    syncService.getNetworkStatus()
  );

  React.useEffect(() => {
    return syncService.addListener(setStatus);
  }, []);

  return {
    status,
    isOnline: status === 'online',
    isOffline: status === 'offline',
  };
}

// Import React for the hook
import React from 'react';
