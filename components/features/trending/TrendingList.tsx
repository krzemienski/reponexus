import React, { useState, useMemo } from 'react';
import { View, RefreshControl, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { TrendingCard } from './TrendingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Chip } from '@/components/ui/Chip';
import { Shimmer } from '@/components/ui/Loading';
import { Card } from '@/components/ui/Card';
import type { TrendingItem, TrendingPeriod } from '@/types/models';

interface TrendingListProps {
  items: TrendingItem[];
  isLoading?: boolean;
  isError?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onPeriodChange?: (period: TrendingPeriod) => void;
  selectedPeriod?: TrendingPeriod;
  errorType?: 'network' | 'server' | 'notFound' | 'unauthorized' | 'general';
  onRetry?: () => void;
}

const PERIODS: { value: TrendingPeriod; label: string }[] = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
];

const TrendingCardSkeleton: React.FC = () => {
  return (
    <Card variant="elevated">
      <View className="space-y-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-3">
            <Shimmer width={40} height={40} borderRadius={20} />
            <Shimmer width={40} height={20} />
          </View>
          <Shimmer width={100} height={24} />
        </View>

        <View>
          <Shimmer width={100} height={16} />
          <View className="h-2" />
          <Shimmer width={200} height={24} />
        </View>

        <Shimmer width="100%" height={40} />

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-4">
            <Shimmer width={60} height={20} />
            <Shimmer width={60} height={20} />
          </View>
          <Shimmer width={80} height={24} borderRadius={12} />
        </View>

        <View className="flex-row items-center space-x-2">
          <Shimmer width={32} height={32} borderRadius={16} />
          <Shimmer width={32} height={32} borderRadius={16} />
          <Shimmer width={32} height={32} borderRadius={16} />
        </View>
      </View>
    </Card>
  );
};

export const TrendingList: React.FC<TrendingListProps> = ({
  items,
  isLoading = false,
  isError = false,
  isRefreshing = false,
  onRefresh,
  onPeriodChange,
  selectedPeriod = 'daily',
  errorType = 'general',
  onRetry,
}) => {
  const [previousRanks, setPreviousRanks] = useState<Map<string, number>>(new Map());

  // Track rank changes
  useMemo(() => {
    const newRanks = new Map<string, number>();
    items.forEach((item) => {
      newRanks.set(item.repository.id, item.rank);
    });

    // Update previous ranks after a delay to allow animation
    setTimeout(() => {
      setPreviousRanks(newRanks);
    }, 1000);
  }, [items]);

  const renderHeader = () => {
    if (!onPeriodChange) return null;

    return (
      <View className="px-4 pt-4 pb-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-1"
        >
          <View className="flex-row space-x-2 px-1">
            {PERIODS.map((period) => (
              <Chip
                key={period.value}
                label={period.label}
                selected={selectedPeriod === period.value}
                onPress={() => onPeriodChange(period.value)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Show loading skeleton on initial load
  if (isLoading && items.length === 0) {
    return (
      <View className="flex-1">
        {renderHeader()}
        <View className="flex-1 px-4 space-y-4">
          {[...Array(5)].map((_, index) => (
            <TrendingCardSkeleton key={index} />
          ))}
        </View>
      </View>
    );
  }

  // Show error state
  if (isError && items.length === 0) {
    return (
      <View className="flex-1">
        {renderHeader()}
        <ErrorState type={errorType} onRetry={onRetry} />
      </View>
    );
  }

  // Show empty state
  if (items.length === 0) {
    return (
      <View className="flex-1">
        {renderHeader()}
        <EmptyState
          icon="trending-up-outline"
          title="No trending repositories"
          message="Check back later for trending repositories."
        />
      </View>
    );
  }

  const renderItem = ({ item }: { item: TrendingItem }) => (
    <View className="mb-4">
      <TrendingCard
        item={item}
        previousRank={previousRanks.get(item.repository.id)}
      />
    </View>
  );

  return (
    <FlashList
      data={items}
      renderItem={renderItem}
      estimatedItemSize={250}
      keyExtractor={(item) => item.repository.id}
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={renderHeader}
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
    />
  );
};

export default TrendingList;
