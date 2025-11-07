/**
 * TanStack Query Persistence Service
 *
 * Provides persistence for React Query cache using MMKV storage.
 * Enables offline-first functionality by persisting query results.
 */

import { PersistedClient, Persister } from '@tanstack/react-query-persist-client';
import { MMKVStorage } from '@/services/storage/mmkv';

const PERSIST_KEY = 'react_query_cache';

/**
 * Create a persister for TanStack Query using MMKV
 */
export function createMMKVPersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      try {
        MMKVStorage.set(PERSIST_KEY, JSON.stringify(client));
        if (__DEV__) {
          console.log('[Persister] Cache persisted successfully');
        }
      } catch (error) {
        console.error('[Persister] Failed to persist cache:', error);
      }
    },

    restoreClient: async (): Promise<PersistedClient | undefined> => {
      try {
        const stored = MMKVStorage.getString(PERSIST_KEY);
        if (!stored) {
          if (__DEV__) {
            console.log('[Persister] No cached data found');
          }
          return undefined;
        }

        const client = JSON.parse(stored);

        if (__DEV__) {
          console.log('[Persister] Cache restored successfully');
        }

        return client;
      } catch (error) {
        console.error('[Persister] Failed to restore cache:', error);
        return undefined;
      }
    },

    removeClient: async () => {
      try {
        MMKVStorage.delete(PERSIST_KEY);
        if (__DEV__) {
          console.log('[Persister] Cache cleared successfully');
        }
      } catch (error) {
        console.error('[Persister] Failed to clear cache:', error);
      }
    },
  };
}

/**
 * Configuration for persistence
 */
export const persistenceConfig = {
  persister: createMMKVPersister(),
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  dehydrateOptions: {
    // Only persist certain query keys
    shouldDehydrateQuery: (query: any) => {
      const queryKey = query.queryKey as string[];

      // Don't persist sensitive data
      if (queryKey.includes('current') || queryKey.includes('authenticated')) {
        return false;
      }

      // Don't persist search queries (they're temporary)
      if (queryKey[0] === 'search') {
        return false;
      }

      // Don't persist queries with errors
      if (query.state.status === 'error') {
        return false;
      }

      // Only persist successful queries
      return query.state.status === 'success';
    },
  },
};

/**
 * Utility to manually clear persisted cache
 */
export async function clearPersistedCache(): Promise<void> {
  const persister = createMMKVPersister();
  await persister.removeClient();
}

/**
 * Utility to get persisted cache size (approximate)
 */
export function getPersistedCacheSize(): number {
  try {
    const stored = MMKVStorage.getString(PERSIST_KEY);
    if (!stored) return 0;

    // Return size in bytes
    return new Blob([stored]).size;
  } catch (error) {
    console.error('[Persister] Failed to get cache size:', error);
    return 0;
  }
}

/**
 * Utility to check if cache exists
 */
export function hasPersistedCache(): boolean {
  try {
    const stored = MMKVStorage.getString(PERSIST_KEY);
    return !!stored;
  } catch (error) {
    return false;
  }
}

/**
 * Utility to get cache metadata
 */
export function getCacheMetadata(): {
  exists: boolean;
  size: number;
  timestamp?: number;
} {
  try {
    const stored = MMKVStorage.getString(PERSIST_KEY);
    if (!stored) {
      return { exists: false, size: 0 };
    }

    const client = JSON.parse(stored) as PersistedClient;
    return {
      exists: true,
      size: new Blob([stored]).size,
      timestamp: client.timestamp,
    };
  } catch (error) {
    console.error('[Persister] Failed to get cache metadata:', error);
    return { exists: false, size: 0 };
  }
}
