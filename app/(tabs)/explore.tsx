import React, { useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Searchbar, Text, Chip, Button, Surface, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { RepositoryList } from '@/components/features/repository/RepositoryList';
import { FilterSheet } from '@/components/features/search/FilterSheet';
import type { SortOption } from '@/types/models';

const TRENDING_TOPICS = ['React', 'TypeScript', 'Python', 'Go', 'Rust', 'AI', 'Web3'];

// Mock repository data for testing
const MOCK_REPOSITORIES = [
  {
    id: '1',
    githubId: '10270250',
    nodeId: 'MDEwOlJlcG9zaXRvcnkxMDI3MDI1MA==',
    nameWithOwner: 'facebook/react',
    name: 'react',
    ownerLogin: 'facebook',
    description: 'A declarative, efficient, and flexible JavaScript library for building user interfaces.',
    isPrivate: false,
    isFork: false,
    isArchived: false,
    stargazerCount: 234000,
    watcherCount: 6789,
    forkCount: 45678,
    openIssuesCount: 1234,
    primaryLanguage: 'JavaScript',
    languages: { JavaScript: 80, TypeScript: 15, CSS: 5 } as Record<string, number>,
    topics: ['javascript', 'react', 'frontend', 'ui', 'declarative'],
    htmlUrl: 'https://github.com/facebook/react',
    apiUrl: 'https://api.github.com/repos/facebook/react',
    createdAt: new Date('2013-05-24').toISOString(),
    updatedAt: new Date().toISOString(),
    lastFetchedAt: new Date().toISOString(),
  },
  {
    id: '2',
    githubId: '28457823',
    nodeId: 'MDEwOlJlcG9zaXRvcnkyODQ1NzgyMw==',
    nameWithOwner: 'microsoft/typescript',
    name: 'TypeScript',
    ownerLogin: 'microsoft',
    description: 'TypeScript is a superset of JavaScript that compiles to clean JavaScript output.',
    isPrivate: false,
    isFork: false,
    isArchived: false,
    stargazerCount: 108000,
    watcherCount: 3200,
    forkCount: 13400,
    openIssuesCount: 6789,
    primaryLanguage: 'TypeScript',
    languages: { TypeScript: 95, JavaScript: 5 } as Record<string, number>,
    topics: ['typescript', 'language', 'javascript', 'compiler'],
    htmlUrl: 'https://github.com/microsoft/TypeScript',
    apiUrl: 'https://api.github.com/repos/microsoft/TypeScript',
    createdAt: new Date('2014-06-17').toISOString(),
    updatedAt: new Date().toISOString(),
    lastFetchedAt: new Date().toISOString(),
  },
  {
    id: '3',
    githubId: '22514524',
    nodeId: 'MDEwOlJlcG9zaXRvcnkyMjUxNDUyNA==',
    nameWithOwner: 'vercel/next.js',
    name: 'next.js',
    ownerLogin: 'vercel',
    description: 'The React Framework for Production',
    isPrivate: false,
    isFork: false,
    isArchived: false,
    stargazerCount: 134000,
    watcherCount: 1900,
    forkCount: 27000,
    openIssuesCount: 2456,
    primaryLanguage: 'JavaScript',
    languages: { JavaScript: 70, TypeScript: 28, CSS: 2 } as Record<string, number>,
    topics: ['react', 'nextjs', 'framework', 'ssr', 'static-site'],
    htmlUrl: 'https://github.com/vercel/next.js',
    apiUrl: 'https://api.github.com/repos/vercel/next.js',
    createdAt: new Date('2016-10-05').toISOString(),
    updatedAt: new Date().toISOString(),
    lastFetchedAt: new Date().toISOString(),
  },
];

export default function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('stars');
  const [filterVisible, setFilterVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Use mock data for testing
  const repositories = MOCK_REPOSITORIES;
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
    setFilterVisible(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
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
