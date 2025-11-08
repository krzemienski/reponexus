import React, { useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, SegmentedButtons, Surface } from 'react-native-paper';
import { TrendingList } from '@/components/features/trending/TrendingList';
import { useTrending } from '@/hooks/queries';
import type { TrendingPeriod } from '@/types/models';

export default function TrendingScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<TrendingPeriod>('daily');

  // Fetch trending data from API
  const { data, isLoading, isError, refetch, isFetching } = useTrending({
    period: selectedPeriod,
  });

  const trendingItems = data || [];
  const isRefreshing = isFetching;

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period as TrendingPeriod);
    console.log('Period changed to:', period);
  };

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Surface style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ padding: 16, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>
              Trending
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 8, height: 8, backgroundColor: '#10b981', borderRadius: 4, marginRight: 8 }} />
              <Text variant="labelMedium" style={{ color: '#10b981' }}>
                Live
              </Text>
            </View>
          </View>
        </View>

        {/* Period Selector */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          <SegmentedButtons
            value={selectedPeriod}
            onValueChange={handlePeriodChange}
            buttons={[
              {
                value: 'daily',
                label: 'Daily',
              },
              {
                value: 'weekly',
                label: 'Weekly',
              },
              {
                value: 'monthly',
                label: 'Monthly',
              },
            ]}
          />
        </View>

        {/* Trending List */}
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
        >
          <TrendingList
            items={trendingItems}
            isLoading={isLoading}
            isError={isError}
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
            onPeriodChange={handlePeriodChange}
            selectedPeriod={selectedPeriod}
          />
        </ScrollView>
      </Surface>
    </SafeAreaView>
  );
}
