# Query Hooks Documentation

This directory contains all TanStack Query hooks for data fetching and state management in Repo Nexus.

## Structure

```
hooks/queries/
├── index.ts              # Central export file
├── useRepositories.ts    # Repository query hooks
├── useTopics.ts          # Topic query hooks
├── useUser.ts            # User query hooks
├── useSearch.ts          # Search query hooks
└── useMutations.ts       # Mutation hooks
```

## Features

### ✅ Comprehensive Query Coverage
- Repository queries (list, detail, trending, README)
- Topic queries (list, detail, repositories)
- User queries (current user, profile, starred repos)
- Search queries (repositories, topics)

### ✅ Advanced Caching
- Intelligent cache times (5min-1hr depending on data type)
- Automatic stale data detection
- Placeholder data for instant UI updates
- Query key factory for consistent invalidation

### ✅ Optimistic Updates
- Instant UI feedback on mutations
- Automatic rollback on errors
- Haptic feedback integration
- Cache invalidation on success

### ✅ Offline Support
- Offline-first network mode
- Query persistence with MMKV
- Mutation queue for offline actions
- Automatic sync when online

### ✅ Infinite Scroll
- Built-in pagination support
- Cursor-based and offset-based pagination
- Optimized for FlashList integration

### ✅ Search with Debouncing
- 300ms debounce for search queries
- Minimum 2-character search threshold
- Search suggestions support
- Shorter cache times (2min)

## Usage Examples

### Basic Query

```typescript
import { useRepositories } from '@/hooks/queries';

function RepositoryList() {
  const { data, isLoading, error } = useRepositories({
    page: 1,
    perPage: 20,
    sort: 'stars'
  });

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return <List data={data.data} />;
}
```

### Infinite Scroll

```typescript
import { useInfiniteRepositories } from '@/hooks/queries';

function InfiniteRepositoryList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteRepositories({ perPage: 20 });

  return (
    <FlashList
      data={data?.pages.flatMap(page => page.data)}
      onEndReached={() => hasNextPage && fetchNextPage()}
      onEndReachedThreshold={0.5}
    />
  );
}
```

### Mutations with Optimistic Updates

```typescript
import { useStarRepository } from '@/hooks/queries';

function StarButton({ repositoryId, isStarred }) {
  const { mutate, isPending } = useStarRepository();

  const handleStar = () => {
    mutate({ repositoryId }, {
      onSuccess: () => {
        // Cache is automatically updated
        console.log('Repository starred!');
      }
    });
  };

  return <Button onPress={handleStar} loading={isPending} />;
}
```

### Search with Debouncing

```typescript
import { useSearchRepositories } from '@/hooks/queries';

function SearchBar() {
  const [query, setQuery] = useState('');
  const { data, isLoading } = useSearchRepositories(query);

  // Automatically debounced - no need for manual debouncing!

  return (
    <View>
      <TextInput value={query} onChangeText={setQuery} />
      {isLoading && <Loading />}
      {data && <Results items={data.items} />}
    </View>
  );
}
```

### Prefetching

```typescript
import { prefetchManager } from '@/services/cache/prefetch';

// Prefetch on navigation
function navigateToRepository(id: string) {
  // Prefetch data before navigation for instant loading
  prefetchManager.prefetchRepositoryDetail(id);
  router.push(`/repository/${id}`);
}
```

## Cache Management

### Query Keys

All query keys are centralized in `services/api/queryKeys.ts`:

```typescript
import { queryKeys } from '@/services/api/queryKeys';

// Invalidate specific repository
queryClient.invalidateQueries({
  queryKey: queryKeys.repositories.detail('123')
});

// Invalidate all repositories
queryClient.invalidateQueries({
  queryKey: queryKeys.repositories.all
});
```

### Cache Configuration

Each query has optimized cache settings:

| Query Type | Stale Time | Cache Time | Refetch on Focus |
|-----------|-----------|-----------|-----------------|
| Repositories | 5 min | 1 hour | No |
| Topics | 10 min | 1 hour | No |
| User (current) | 2 min | 10 min | No |
| Search | 2 min | 10 min | No |
| Trending | 10 min | 30 min | Yes |

## Offline Support

### Automatic Persistence

Queries are automatically persisted to MMKV storage:

```typescript
// Handled automatically in app/_layout.tsx
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={persistenceConfig}
>
  {children}
</PersistQueryClientProvider>
```

### Offline Queue

Mutations are queued when offline and retried when online:

```typescript
import { offlineQueue } from '@/services/offline/offlineQueue';

// Add mutation to queue
offlineQueue.add({
  endpoint: '/api/repositories/123/star',
  method: 'PUT',
  data: {},
  maxRetries: 3
});

// Process queue when online
await offlineQueue.process(async (mutation) => {
  await apiClient[mutation.method.toLowerCase()](
    mutation.endpoint,
    mutation.data
  );
});
```

### Network Status

```typescript
import { useNetworkStatus } from '@/services/offline/syncService';

function NetworkIndicator() {
  const { isOnline, isOffline } = useNetworkStatus();

  if (isOffline) {
    return <OfflineBanner />;
  }

  return null;
}
```

## Testing

All hooks include comprehensive tests:

```bash
npm test hooks/queries
```

Test coverage includes:
- Successful data fetching
- Error handling
- Loading states
- Parameter passing
- Optimistic updates
- Rollback on errors
- Cache invalidation

## Best Practices

### 1. Use TypeScript

All hooks are fully typed:

```typescript
const { data } = useRepository('123');
// data is typed as Repository | undefined
```

### 2. Handle Loading & Error States

```typescript
const { data, isLoading, error } = useRepositories();

if (isLoading) return <Loading />;
if (error) return <Error />;
if (!data) return null;

return <List data={data.data} />;
```

### 3. Use Query Options

```typescript
const { data } = useRepositories({}, {
  enabled: isAuthenticated, // Conditional fetching
  refetchInterval: 10000,   // Polling
  onSuccess: (data) => {    // Callbacks
    console.log('Data loaded');
  }
});
```

### 4. Prefetch for Better UX

```typescript
// Prefetch on hover/press
<TouchableOpacity
  onPressIn={() => prefetchManager.prefetchRepository('123')}
  onPress={() => router.push('/repository/123')}
>
  <Text>View Repository</Text>
</TouchableOpacity>
```

### 5. Use Optimistic Updates

```typescript
const { mutate } = useStarRepository();

// UI updates immediately, rolls back on error
mutate({ repositoryId: '123' });
```

## Performance Tips

1. **Use Infinite Queries** for long lists instead of manual pagination
2. **Prefetch** related data before navigation
3. **Configure staleTime** appropriately for your data
4. **Use placeholderData** for instant UI updates
5. **Enable persistence** for offline-first experience

## Troubleshooting

### Queries not refetching

Check if data is still fresh (within staleTime):

```typescript
const { data, isStale } = useRepositories();
console.log('Is stale:', isStale);
```

### Cache not persisting

Ensure MMKV is properly initialized:

```typescript
import { MMKVStorage } from '@/services/storage/mmkv';
console.log('MMKV initialized:', !!MMKVStorage);
```

### Mutations not working offline

Check if offline queue is processing:

```typescript
import { offlineQueue } from '@/services/offline/offlineQueue';
console.log('Queue size:', offlineQueue.size());
```

## Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [Offline-First Architecture](https://web.dev/offline-first/)
