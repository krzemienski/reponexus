import React from 'react';
import { View, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { RepositoryCard, RepositoryCardSkeleton } from './RepositoryCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingSpinner } from '@/components/ui/Loading';
import type { Repository } from '@/types/models';

interface RepositoryListProps {
  repositories: Repository[];
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  isRefreshing?: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onStar?: (repositoryId: string) => void;
  starredRepositories?: Set<string>;
  emptyTitle?: string;
  emptyMessage?: string;
  errorType?: 'network' | 'server' | 'notFound' | 'unauthorized' | 'general';
  onRetry?: () => void;
}

export const RepositoryList: React.FC<RepositoryListProps> = ({
  repositories,
  isLoading = false,
  isError = false,
  isEmpty = false,
  isRefreshing = false,
  isFetchingNextPage = false,
  hasNextPage = false,
  onRefresh,
  onEndReached,
  onStar,
  starredRepositories = new Set(),
  emptyTitle = 'No repositories found',
  emptyMessage = 'Try adjusting your search or filters.',
  errorType = 'general',
  onRetry,
}) => {
  // Show loading skeleton on initial load
  if (isLoading && repositories.length === 0) {
    return (
      <View className="flex-1 px-4 space-y-4">
        {[...Array(5)].map((_, index) => (
          <RepositoryCardSkeleton key={index} />
        ))}
      </View>
    );
  }

  // Show error state
  if (isError && repositories.length === 0) {
    return <ErrorState type={errorType} onRetry={onRetry} />;
  }

  // Show empty state
  if (isEmpty && repositories.length === 0) {
    return (
      <EmptyState
        icon="git-branch-outline"
        title={emptyTitle}
        message={emptyMessage}
      />
    );
  }

  const renderItem = ({ item }: { item: Repository }) => (
    <View className="mb-4">
      <RepositoryCard
        repository={item}
        onStar={onStar ? () => onStar(item.id) : undefined}
        isStarred={starredRepositories.has(item.id)}
      />
    </View>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;

    return (
      <View className="py-4">
        <LoadingSpinner size="small" />
      </View>
    );
  };

  return (
    <FlashList
      data={repositories}
      renderItem={renderItem}
      estimatedItemSize={200}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#0284c7"
            colors={['#0284c7']}
          />
        ) : undefined
      }
      onEndReached={hasNextPage ? onEndReached : undefined}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
    />
  );
};

export default RepositoryList;
