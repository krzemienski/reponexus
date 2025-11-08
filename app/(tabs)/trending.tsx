import React, { useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, SegmentedButtons, Surface } from 'react-native-paper';
import { TrendingList } from '@/components/features/trending/TrendingList';
import type { TrendingPeriod } from '@/types/models';

// Mock trending data for testing
const MOCK_TRENDING_ITEMS = [
  {
    repository: {
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
    rank: 1,
    stars: 234000,
    starsToday: 523,
    language: 'JavaScript',
    builtBy: [
      { username: 'gaearon', url: 'https://github.com/gaearon', avatar: 'https://github.com/gaearon.png' },
      { username: 'sophiebits', url: 'https://github.com/sophiebits', avatar: 'https://github.com/sophiebits.png' },
    ],
  },
  {
    repository: {
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
    rank: 2,
    stars: 108000,
    starsToday: 412,
    language: 'TypeScript',
    builtBy: [
      { username: 'ahejlsberg', url: 'https://github.com/ahejlsberg', avatar: 'https://github.com/ahejlsberg.png' },
    ],
  },
  {
    repository: {
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
    rank: 3,
    stars: 134000,
    starsToday: 387,
    language: 'JavaScript',
    builtBy: [
      { username: 'Timer', url: 'https://github.com/Timer', avatar: 'https://github.com/Timer.png' },
      { username: 'ijjk', url: 'https://github.com/ijjk', avatar: 'https://github.com/ijjk.png' },
    ],
  },
];

export default function TrendingScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<TrendingPeriod>('daily');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use mock data for testing
  const trendingItems = MOCK_TRENDING_ITEMS;
  const isLoading = false;
  const isError = false;

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period as TrendingPeriod);
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
