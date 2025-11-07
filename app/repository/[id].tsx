import React, { useState } from 'react';
import { View, ScrollView, Pressable, Linking, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { StarButton } from '@/components/shared/StarButton';
import { LanguageTag } from '@/components/shared/LanguageTag';
import type { Repository } from '@/types/models';

export default function RepositoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isStarred, setIsStarred] = useState(false);

  // Mock repository data - in production, this would come from React Query
  const repository: Repository = {
    id: id as string,
    githubId: '123',
    nodeId: 'node123',
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
  };

  const handleStar = () => {
    setIsStarred(!isStarred);
  };

  const handleOpenInBrowser = () => {
    Linking.openURL(repository.htmlUrl);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${repository.nameWithOwner} on GitHub: ${repository.htmlUrl}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-dark-50">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-4 flex-row items-center justify-between border-b border-dark-200">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </Pressable>

          <View className="flex-row space-x-3">
            <Pressable onPress={handleShare} hitSlop={8}>
              <Ionicons name="share-outline" size={24} color="#ffffff" />
            </Pressable>
            <Pressable onPress={handleOpenInBrowser} hitSlop={8}>
              <Ionicons name="open-outline" size={24} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        <ScrollView className="flex-1">
          <View className="px-4 py-6 space-y-4">
            {/* Owner Avatar and Name */}
            <View className="flex-row items-center space-x-3">
              <Avatar
                source={`https://github.com/${repository.ownerLogin}.png`}
                name={repository.ownerLogin}
                size="md"
              />
              <View className="flex-1">
                <Text variant="caption" color="gray">
                  {repository.ownerLogin}
                </Text>
                <Text variant="title" weight="bold">
                  {repository.name}
                </Text>
              </View>
            </View>

            {/* Description */}
            {repository.description && (
              <Card variant="flat">
                <Text variant="body" color="gray">
                  {repository.description}
                </Text>
              </Card>
            )}

            {/* Stats Grid */}
            <View className="flex-row space-x-2">
              <Card variant="elevated" style={{ flex: 1 }}>
                <View className="items-center">
                  <Ionicons name="star" size={24} color="#fbbf24" />
                  <Text variant="title" weight="bold" className="mt-2">
                    {repository.stargazerCount.toLocaleString()}
                  </Text>
                  <Text variant="caption" color="gray">
                    Stars
                  </Text>
                </View>
              </Card>

              <Card variant="elevated" style={{ flex: 1 }}>
                <View className="items-center">
                  <Ionicons name="git-branch" size={24} color="#0284c7" />
                  <Text variant="title" weight="bold" className="mt-2">
                    {repository.forkCount.toLocaleString()}
                  </Text>
                  <Text variant="caption" color="gray">
                    Forks
                  </Text>
                </View>
              </Card>

              <Card variant="elevated" style={{ flex: 1 }}>
                <View className="items-center">
                  <Ionicons name="alert-circle" size={24} color="#ef4444" />
                  <Text variant="title" weight="bold" className="mt-2">
                    {repository.openIssuesCount.toLocaleString()}
                  </Text>
                  <Text variant="caption" color="gray">
                    Issues
                  </Text>
                </View>
              </Card>
            </View>

            {/* Language */}
            {repository.primaryLanguage && (
              <Card variant="flat">
                <View className="flex-row items-center justify-between">
                  <Text variant="body" weight="medium">
                    Primary Language
                  </Text>
                  <LanguageTag language={repository.primaryLanguage} />
                </View>
              </Card>
            )}

            {/* Topics */}
            {repository.topics && repository.topics.length > 0 && (
              <Card variant="flat">
                <Text variant="body" weight="medium" className="mb-3">
                  Topics
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {repository.topics.map((topic) => (
                    <Chip
                      key={topic}
                      label={topic}
                      icon="pricetag"
                      onPress={() => router.push(`/topic/${topic}`)}
                    />
                  ))}
                </View>
              </Card>
            )}

            {/* Actions */}
            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Button
                  variant={isStarred ? 'outline' : 'primary'}
                  onPress={handleStar}
                >
                  <View className="flex-row items-center">
                    <Ionicons
                      name={isStarred ? 'star' : 'star-outline'}
                      size={20}
                      color={isStarred ? '#fbbf24' : '#ffffff'}
                    />
                    <Text weight="semibold" className="ml-2">
                      {isStarred ? 'Starred' : 'Star'}
                    </Text>
                  </View>
                </Button>
              </View>

              <Button variant="outline" onPress={handleOpenInBrowser}>
                <Ionicons name="open-outline" size={20} color="#0284c7" />
              </Button>
            </View>

            {/* README Section */}
            <Card variant="elevated">
              <View className="flex-row items-center mb-3">
                <Ionicons name="document-text-outline" size={20} color="#0284c7" />
                <Text variant="body" weight="semibold" className="ml-2">
                  README
                </Text>
              </View>
              <Text color="gray" variant="body">
                README content would be rendered here with markdown support.
              </Text>
            </Card>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
