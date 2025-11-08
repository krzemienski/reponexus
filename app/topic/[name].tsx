import React, { useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text, Button, Surface, Card, Chip, IconButton, Avatar } from 'react-native-paper';
import { RepositoryList } from '@/components/features/repository/RepositoryList';

// Mock repositories for the topic
const MOCK_TOPIC_REPOS = [
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
    languages: { JavaScript: 80, TypeScript: 15, CSS: 5 },
    topics: ['javascript', 'react', 'frontend', 'ui', 'declarative'],
    htmlUrl: 'https://github.com/facebook/react',
    apiUrl: 'https://api.github.com/repos/facebook/react',
    createdAt: new Date('2013-05-24').toISOString(),
    updatedAt: new Date().toISOString(),
    lastFetchedAt: new Date().toISOString(),
  },
  {
    id: '2',
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
    languages: { JavaScript: 70, TypeScript: 28, CSS: 2 },
    topics: ['react', 'nextjs', 'framework', 'ssr', 'static-site'],
    htmlUrl: 'https://github.com/vercel/next.js',
    apiUrl: 'https://api.github.com/repos/vercel/next.js',
    createdAt: new Date('2016-10-05').toISOString(),
    updatedAt: new Date().toISOString(),
    lastFetchedAt: new Date().toISOString(),
  },
];

export default function TopicDetailScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data - in production, this would come from React Query
  const topic = {
    name: name as string,
    displayName: (name as string).charAt(0).toUpperCase() + (name as string).slice(1),
    description: 'A popular topic with many repositories and active contributors.',
    repositoryCount: 45678,
    relatedTopics: ['javascript', 'typescript', 'frontend', 'web'],
  };

  const repositories = MOCK_TOPIC_REPOS;
  const isLoading = false;
  const isError = false;

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleRelatedTopicPress = (relatedTopic: string) => {
    router.push(`/topic/${relatedTopic}`);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Surface style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => router.back()}
          />
        </View>

        {/* Topic Header */}
        <View style={{ padding: 16, paddingTop: 0, gap: 16 }}>
          <View style={{ alignItems: 'center' }}>
            <Avatar.Text
              size={80}
              label={topic.displayName.charAt(0).toUpperCase()}
              style={{ marginBottom: 12 }}
            />

            <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 4 }}>
              {topic.displayName}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <IconButton icon="source-fork" size={16} style={{ margin: 0 }} />
              <Text variant="labelMedium" style={{ opacity: 0.7 }}>
                {topic.repositoryCount.toLocaleString()} repositories
              </Text>
            </View>

            {topic.description && (
              <Text variant="bodyMedium" style={{ textAlign: 'center', marginBottom: 12, opacity: 0.8 }}>
                {topic.description}
              </Text>
            )}

            <Button
              mode={isFollowing ? 'outlined' : 'contained'}
              onPress={handleFollow}
              icon={isFollowing ? 'check' : 'plus'}
              style={{ minWidth: 192 }}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          </View>

          {/* Related Topics */}
          {topic.relatedTopics && topic.relatedTopics.length > 0 && (
            <Card mode="contained">
              <Card.Content>
                <Text variant="bodyMedium" style={{ fontWeight: '600', marginBottom: 12 }}>
                  Related Topics
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {topic.relatedTopics.map((relatedTopic) => (
                    <Chip
                      key={relatedTopic}
                      icon="tag"
                      onPress={() => handleRelatedTopicPress(relatedTopic)}
                      mode="outlined"
                    >
                      {relatedTopic}
                    </Chip>
                  ))}
                </View>
              </Card.Content>
            </Card>
          )}
        </View>

        {/* Repository List */}
        <View style={{ flex: 1, paddingTop: 8 }}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text variant="titleMedium" style={{ fontWeight: '600' }}>
              Popular Repositories
            </Text>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
              />
            }
          >
            <RepositoryList
              repositories={repositories}
              isLoading={isLoading}
              isError={isError}
              isRefreshing={isRefreshing}
              onRefresh={handleRefresh}
              isEmpty={repositories.length === 0}
              emptyTitle="No repositories found"
              emptyMessage={`No repositories found for the ${topic.displayName} topic.`}
            />
          </ScrollView>
        </View>
      </Surface>
    </SafeAreaView>
  );
}
