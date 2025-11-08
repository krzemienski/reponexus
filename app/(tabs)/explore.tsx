import React, { useState, useMemo } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, SegmentedButtons, Menu, Button, Surface, Divider, Chip } from 'react-native-paper';
import { TrendingList } from '@/components/features/trending/TrendingList';
import { useTrending, useUserTopics } from '@/hooks/queries';
import type { TrendingPeriod } from '@/types/models';

export default function ExploreScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<TrendingPeriod>('daily');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [topicMenuVisible, setTopicMenuVisible] = useState(false);

  // Fetch user's followed topics
  const { data: userTopicsData } = useUserTopics();
  const userTopics = userTopicsData || [];

  // Fetch trending data from API (filtered by topic if selected)
  const { data, isLoading, isError, refetch, isFetching } = useTrending({
    period: selectedPeriod,
    // TODO: Add topic filter to API when available
    // topic: selectedTopic || undefined,
  });

  const trendingItems = data || [];
  const isRefreshing = isFetching;

  // Filter trending items by selected topic if one is selected
  const filteredTrendingItems = useMemo(() => {
    if (!selectedTopic) return trendingItems;
    return trendingItems.filter(item =>
      item.repository.topics.includes(selectedTopic.toLowerCase())
    );
  }, [trendingItems, selectedTopic]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period as TrendingPeriod);
    console.log('Period changed to:', period);
  };

  const handleTopicSelect = (topicName: string) => {
    setSelectedTopic(selectedTopic === topicName ? null : topicName);
    setTopicMenuVisible(false);
  };

  const handleClearTopic = () => {
    setSelectedTopic(null);
  };

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Surface style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ padding: 16, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
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
          <Text variant="bodyMedium" style={{ opacity: 0.7, marginBottom: 12 }}>
            Discover what's trending in your followed topics
          </Text>
        </View>

        {/* Topic Filter */}
        {userTopics.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Text variant="labelLarge" style={{ opacity: 0.7 }}>
                Filter by topic:
              </Text>
              <Menu
                visible={topicMenuVisible}
                onDismiss={() => setTopicMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setTopicMenuVisible(true)}
                    compact
                    icon="chevron-down"
                  >
                    {selectedTopic || 'All Topics'}
                  </Button>
                }
              >
                <Menu.Item
                  onPress={() => handleTopicSelect('')}
                  title="All Topics"
                  leadingIcon={!selectedTopic ? 'check' : undefined}
                />
                <Divider />
                {userTopics.map((topic) => (
                  <Menu.Item
                    key={topic.id}
                    onPress={() => handleTopicSelect(topic.name)}
                    title={topic.displayName}
                    leadingIcon={selectedTopic === topic.name ? 'check' : undefined}
                  />
                ))}
              </Menu>
              {selectedTopic && (
                <Chip
                  onClose={handleClearTopic}
                  mode="flat"
                >
                  {selectedTopic}
                </Chip>
              )}
            </View>
          </View>
        )}

        {/* No Topics Message */}
        {userTopics.length === 0 && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fef3c7', borderRadius: 8, margin: 16 }}>
            <Text variant="bodyMedium" style={{ color: '#92400e', textAlign: 'center', marginBottom: 8 }}>
              You haven't followed any topics yet
            </Text>
            <Text variant="bodySmall" style={{ color: '#92400e', opacity: 0.8, textAlign: 'center' }}>
              Follow topics on the Topics tab to see personalized trending repositories
            </Text>
          </View>
        )}

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
            items={filteredTrendingItems}
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
