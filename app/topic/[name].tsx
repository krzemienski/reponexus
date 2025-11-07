import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { RepositoryList } from '@/components/features/repository/RepositoryList';
import { FollowButton } from '@/components/shared/FollowButton';

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

  const repositories: any[] = [];
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
    <SafeAreaView className="flex-1 bg-dark-50">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-4 flex-row items-center justify-between border-b border-dark-200">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </Pressable>
        </View>

        {/* Topic Header */}
        <View className="px-4 py-6 space-y-4">
          <View className="items-center">
            <View className="w-20 h-20 rounded-full bg-primary-600/20 items-center justify-center mb-4">
              <Text variant="heading">
                {topic.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>

            <Text variant="heading" weight="bold" className="mb-2">
              {topic.displayName}
            </Text>

            <View className="flex-row items-center mb-4">
              <Ionicons name="git-branch" size={16} color="#71717a" />
              <Text color="gray" variant="caption" className="ml-1">
                {topic.repositoryCount.toLocaleString()} repositories
              </Text>
            </View>

            {topic.description && (
              <Text color="gray" variant="body" className="text-center mb-4">
                {topic.description}
              </Text>
            )}

            <View className="w-48">
              <FollowButton
                isFollowing={isFollowing}
                onPress={handleFollow}
                size="md"
              />
            </View>
          </View>

          {/* Related Topics */}
          {topic.relatedTopics && topic.relatedTopics.length > 0 && (
            <Card variant="flat">
              <Text variant="body" weight="medium" className="mb-3">
                Related Topics
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {topic.relatedTopics.map((relatedTopic) => (
                  <Chip
                    key={relatedTopic}
                    label={relatedTopic}
                    icon="pricetag"
                    onPress={() => handleRelatedTopicPress(relatedTopic)}
                  />
                ))}
              </View>
            </Card>
          )}
        </View>

        {/* Repository List */}
        <View className="flex-1 border-t border-dark-200">
          <View className="px-4 py-3">
            <Text variant="body" weight="semibold">
              Popular Repositories
            </Text>
          </View>

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
        </View>
      </View>
    </SafeAreaView>
  );
}
