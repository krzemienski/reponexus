# TanStack Query - Quick Reference Guide

## Import Hooks
```typescript
import {
  useRepositories,
  useRepository,
  useInfiniteRepositories,
  useTrending,
  useTopics,
  useTopic,
  useCurrentUser,
  useSearchRepositories,
  useStarRepository,
  useFollowTopic,
} from '@/hooks/queries';
```

## Basic Patterns

### Simple Query
```typescript
const { data, isLoading, error } = useRepositories();
```

### Infinite Scroll
```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteRepositories();
```

### Mutation
```typescript
const { mutate, isPending } = useStarRepository();
mutate({ repositoryId: '123' });
```

### Search (Auto-debounced)
```typescript
const [query, setQuery] = useState('');
const { data } = useSearchRepositories(query);
```

## Cache Management
```typescript
import { cacheManager } from '@/services/cache/cacheManager';
await cacheManager.clearAll();
const stats = cacheManager.getCacheStats();
```

## Prefetch
```typescript
import { prefetchManager } from '@/services/cache/prefetch';
prefetchManager.prefetchRepositoryDetail('123');
```

## Network Status
```typescript
import { useNetworkStatus } from '@/services/offline/syncService';
const { isOnline, isOffline } = useNetworkStatus();
```
