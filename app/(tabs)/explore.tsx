import React, { useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Searchbar, Text, Chip, Button, Surface, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { RepositoryList } from '@/components/features/repository/RepositoryList';
import { FilterSheet } from '@/components/features/search/FilterSheet';
import { useRepositories } from '@/hooks/queries';
import type { SortOption } from '@/types/models';

const TRENDING_TOPICS = ['React', 'TypeScript', 'Python', 'Go', 'Rust', 'AI', 'Web3'];

export default function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('stars');
  const [filterVisible, setFilterVisible] = useState(false);

  // Fetch repositories from API
  const { data, isLoading, isError, refetch, isFetching } = useRepositories({
    sort: sortBy,
    topic: selectedTopic || undefined,
  });

  const repositories = data?.data || [];
  const refreshing = isFetching;

  const handleTopicPress = (topic: string) => {
    setSelectedTopic(selectedTopic === topic ? null : topic);
    router.push(`/topic/${topic.toLowerCase()}`);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Navigate to search results or trigger search
      console.log('Searching for:', searchQuery);
    }
  };

  const handleApplyFilters = (filters: any) => {
    console.log('Applying filters:', filters);
    setFilterVisible(false);
  };

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Surface style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ padding: 16, paddingTop: 16, paddingBottom: 8 }}>
          <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 16 }}>
            Explore
          </Text>

          {/* Search Bar */}
          <Searchbar
            placeholder="Search repositories, topics..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            onSubmitEditing={handleSearch}
            style={{ marginBottom: 8 }}
          />
        </View>

        {/* Trending Topics */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text variant="titleMedium" style={{ fontWeight: '600' }}>
              Trending Topics
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {TRENDING_TOPICS.map((topic) => (
                <Chip
                  key={topic}
                  selected={selectedTopic === topic}
                  onPress={() => handleTopicPress(topic)}
                  icon="fire"
                  mode="outlined"
                >
                  {topic}
                </Chip>
              ))}
            </View>
          </ScrollView>
        </View>

        <Divider />

        {/* Sort and Filter Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text variant="labelLarge" style={{ opacity: 0.7 }}>
            Featured Repositories
          </Text>

          <Button
            mode="text"
            onPress={() => setFilterVisible(true)}
            compact
          >
            Filters
          </Button>
        </View>

        <Divider />

        {/* Repository List */}
        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
          >
            <RepositoryList
              repositories={repositories}
              isLoading={isLoading}
              isError={isError}
              isEmpty={repositories.length === 0}
              emptyTitle="No repositories found"
              emptyMessage="Try adjusting your search or browse trending topics."
            />
          </ScrollView>
        </View>

        {/* Filter Sheet */}
        <FilterSheet
          visible={filterVisible}
          onClose={() => setFilterVisible(false)}
          onApply={handleApplyFilters}
        />
      </Surface>
    </SafeAreaView>
  );
}
