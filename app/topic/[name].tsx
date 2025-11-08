import React from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text, Button, Surface, Card, Chip, IconButton, Avatar } from 'react-native-paper';
import { RepositoryList } from '@/components/features/repository/RepositoryList';
import { useTopic, useTopicRepositories, useToggleTopicFollow } from '@/hooks/queries';

export default function TopicDetailScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();

  // Fetch topic data from API
  const { data: topic, isLoading: isLoadingTopic, isError: isTopicError, error: topicError } = useTopic(name);

  // Fetch repositories for this topic
  const { data: reposData, isLoading: isLoadingRepos, isError: isReposError, refetch, isFetching } = useTopicRepositories(name);

  // Follow/unfollow mutation
  const { toggle: toggleFollow, isLoading: isTogglingFollow } = useToggleTopicFollow(name || '');

  const repositories = reposData?.data || [];
  const isRefreshing = isFetching;
  const isLoading = isLoadingTopic || isLoadingRepos;
  const isError = isTopicError || isReposError;

  const handleFollow = () => {
    if (topic) {
      toggleFollow(topic.isFollowed);
    }
  };

  const handleRefresh = async () => {
    await refetch();
  };

  const handleRelatedTopicPress = (relatedTopic: string) => {
    router.push(`/topic/${relatedTopic}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Surface style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
          <Text variant="bodyMedium" style={{ marginTop: 16, opacity: 0.7 }}>
            Loading topic...
          </Text>
        </Surface>
      </SafeAreaView>
    );
  }

  // Error state
  if (isError || !topic) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Surface style={{ flex: 1 }}>
          <View style={{ padding: 16 }}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => router.back()}
            />
          </View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <IconButton icon="alert-circle" size={48} iconColor="#ef4444" />
            <Text variant="titleLarge" style={{ fontWeight: 'bold', marginTop: 16, textAlign: 'center' }}>
              Failed to Load Topic
            </Text>
            <Text variant="bodyMedium" style={{ marginTop: 8, opacity: 0.7, textAlign: 'center' }}>
              {topicError?.message || 'Unable to fetch topic data. Please try again.'}
            </Text>
            <Button mode="contained" onPress={() => router.back()} style={{ marginTop: 24 }}>
              Go Back
            </Button>
          </View>
        </Surface>
      </SafeAreaView>
    );
  }

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
              mode={topic.isFollowed ? 'outlined' : 'contained'}
              onPress={handleFollow}
              icon={topic.isFollowed ? 'check' : 'plus'}
              style={{ minWidth: 192 }}
              disabled={isTogglingFollow}
              loading={isTogglingFollow}
            >
              {topic.isFollowed ? 'Following' : 'Follow'}
            </Button>
          </View>

          {/* Note: Related Topics would need to be added to the Topic model in the API */}
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
