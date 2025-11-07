import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { TrendingList } from '@/components/features/trending/TrendingList';
import type { TrendingPeriod } from '@/types/models';

export default function TrendingScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<TrendingPeriod>('daily');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data - in production, this would come from React Query
  const trendingItems = [];
  const isLoading = false;
  const isError = false;

  const handlePeriodChange = (period: TrendingPeriod) => {
    setSelectedPeriod(period);
    // Fetch new data for the selected period
    console.log('Period changed to:', period);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <SafeAreaView className="flex-1 bg-dark-50">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row items-center justify-between">
            <Text variant="heading" weight="bold">
              Trending
            </Text>
            <View className="flex-row items-center">
              <View className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              <Text variant="caption" color="success">
                Live
              </Text>
            </View>
          </View>
        </View>

        {/* Trending List with Period Selector */}
        <TrendingList
          items={trendingItems}
          isLoading={isLoading}
          isError={isError}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onPeriodChange={handlePeriodChange}
          selectedPeriod={selectedPeriod}
        />
      </View>
    </SafeAreaView>
  );
}
