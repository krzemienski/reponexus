import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { persistenceConfig } from '@/services/offline/persistance';
import { syncService } from '@/services/offline/syncService';
import { cacheManager } from '@/services/cache/cacheManager';
import { prefetchManager } from '@/services/cache/prefetch';
import '../global.css';

// Create Query Client with enhanced configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry configuration
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Cache configuration
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60, // 1 hour (formerly cacheTime)

      // Refetch configuration
      refetchOnWindowFocus: false, // Don't refetch on every focus
      refetchOnReconnect: true, // Refetch when connection is restored
      refetchOnMount: true,

      // Network mode
      networkMode: 'offlineFirst', // Try cache first, then network
    },
    mutations: {
      // Retry configuration for mutations
      retry: 1, // Only retry once for mutations
      retryDelay: 1000,

      // Network mode
      networkMode: 'offlineFirst',
    },
  },
});

// Query cache event listeners
queryClient.getQueryCache().subscribe((event) => {
  if (__DEV__) {
    if (event.type === 'added') {
      console.log('[QueryCache] Query added:', event.query.queryKey);
    } else if (event.type === 'removed') {
      console.log('[QueryCache] Query removed:', event.query.queryKey);
    }
  }
});

// Mutation cache event listeners
queryClient.getMutationCache().subscribe((event) => {
  if (__DEV__) {
    if (event.type === 'added') {
      console.log('[MutationCache] Mutation added');
    } else if (event.type === 'removed') {
      console.log('[MutationCache] Mutation removed');
    }
  }

  // Handle mutation errors globally
  if (event.type === 'updated' && event.mutation.state.status === 'error') {
    const error = event.mutation.state.error as any;
    console.error('[MutationCache] Mutation failed:', error);

    // Could add global error handling here (e.g., toast notifications)
  }
});

export default function RootLayout() {
  useEffect(() => {
    // Initialize services
    const initializeServices = async () => {
      if (__DEV__) {
        console.log('[App] Initializing services...');
      }

      // Initialize sync service
      syncService.initialize(queryClient);

      // Initialize cache manager
      cacheManager.initialize(queryClient);

      // Initialize prefetch manager
      prefetchManager.initialize(queryClient);

      // Prefetch essential data on app open
      try {
        await prefetchManager.prefetchOnAppOpen();
      } catch (error) {
        console.error('[App] Failed to prefetch initial data:', error);
      }

      if (__DEV__) {
        console.log('[App] Services initialized');
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      syncService.cleanup();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={persistenceConfig}
          onSuccess={() => {
            if (__DEV__) {
              console.log('[App] Query cache hydrated from storage');
            }
          }}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#000000' },
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="repository/[id]" />
            <Stack.Screen name="topic/[name]" />
          </Stack>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
