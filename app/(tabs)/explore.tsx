import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { SearchBar } from '@/components/ui/SearchBar';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { RepositoryList } from '@/components/features/repository/RepositoryList';
import { FilterSheet } from '@/components/features/search/FilterSheet';
import type { SortOption } from '@/types/models';

const TRENDING_TOPICS = ['React', 'TypeScript', 'Python', 'Go', 'Rust', 'AI', 'Web3'];

export default function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('stars');
  const [filterVisible, setFilterVisible] = useState(false);

  // Mock data - in production, this would come from React Query
  const repositories = [];
  const isLoading = false;
  const isError = false;

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
    // Apply filters to the repository list
  };

  return (
    <SafeAreaView className="flex-1 bg-dark-50">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text variant="heading" weight="bold" className="mb-4">
            Explore
          </Text>

          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search repositories, topics..."
            onSubmitEditing={handleSearch}
          />
        </View>

        {/* Trending Topics */}
        <View className="px-4 py-3">
          <View className="flex-row items-center justify-between mb-3">
            <Text variant="body" weight="semibold">
              Trending Topics
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-1"
          >
            <View className="flex-row space-x-2 px-1">
              {TRENDING_TOPICS.map((topic) => (
                <Chip
                  key={topic}
                  label={topic}
                  icon="flame"
                  selected={selectedTopic === topic}
                  onPress={() => handleTopicPress(topic)}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Sort and Filter Bar */}
        <View className="flex-row items-center justify-between px-4 py-2 border-t border-b border-dark-200">
          <Text variant="caption" color="gray">
            Featured Repositories
          </Text>

          <View className="flex-row space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onPress={() => setFilterVisible(true)}
            >
              Filters
            </Button>
          </View>
        </View>

        {/* Repository List */}
        <View className="flex-1">
          <RepositoryList
            repositories={repositories}
            isLoading={isLoading}
            isError={isError}
            isEmpty={repositories.length === 0}
            emptyTitle="No repositories found"
            emptyMessage="Try adjusting your search or browse trending topics."
          />
        </View>

        {/* Filter Sheet */}
        <FilterSheet
          visible={filterVisible}
          onClose={() => setFilterVisible(false)}
          onApply={handleApplyFilters}
        />
      </View>
    </SafeAreaView>
  );
}
