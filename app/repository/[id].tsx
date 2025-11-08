import React, { useState } from 'react';
import { View, ScrollView, Linking, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text, Button, Surface, Card, Chip, Avatar, IconButton, Divider } from 'react-native-paper';
import { LanguageTag } from '@/components/shared/LanguageTag';
import type { Repository } from '@/types/models';

export default function RepositoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isStarred, setIsStarred] = useState(false);

  // Mock repository data - in production, this would come from React Query
  const repository: Repository = {
    id: id as string,
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
    <SafeAreaView style={{ flex: 1 }}>
      <Surface style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => router.back()}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <IconButton
              icon="share-variant"
              size={24}
              onPress={handleShare}
            />
            <IconButton
              icon="open-in-new"
              size={24}
              onPress={handleOpenInBrowser}
            />
          </View>
        </View>

        <ScrollView style={{ flex: 1 }}>
          <View style={{ padding: 16, gap: 16 }}>
            {/* Owner Avatar and Name */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar.Image
                source={{ uri: `https://github.com/${repository.ownerLogin}.png` }}
                size={48}
              />
              <View style={{ flex: 1 }}>
                <Text variant="labelMedium" style={{ opacity: 0.7 }}>
                  {repository.ownerLogin}
                </Text>
                <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>
                  {repository.name}
                </Text>
              </View>
            </View>

            {/* Description */}
            {repository.description && (
              <Card mode="contained">
                <Card.Content>
                  <Text variant="bodyMedium" style={{ opacity: 0.8 }}>
                    {repository.description}
                  </Text>
                </Card.Content>
              </Card>
            )}

            {/* Stats Grid */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Card mode="contained" style={{ flex: 1 }}>
                <Card.Content style={{ alignItems: 'center' }}>
                  <IconButton icon="star" size={28} iconColor="#fbbf24" style={{ margin: 0 }} />
                  <Text variant="titleMedium" style={{ fontWeight: 'bold', marginTop: 4 }}>
                    {repository.stargazerCount.toLocaleString()}
                  </Text>
                  <Text variant="labelSmall" style={{ opacity: 0.7 }}>
                    Stars
                  </Text>
                </Card.Content>
              </Card>

              <Card mode="contained" style={{ flex: 1 }}>
                <Card.Content style={{ alignItems: 'center' }}>
                  <IconButton icon="source-fork" size={28} iconColor="#0ea5e9" style={{ margin: 0 }} />
                  <Text variant="titleMedium" style={{ fontWeight: 'bold', marginTop: 4 }}>
                    {repository.forkCount.toLocaleString()}
                  </Text>
                  <Text variant="labelSmall" style={{ opacity: 0.7 }}>
                    Forks
                  </Text>
                </Card.Content>
              </Card>

              <Card mode="contained" style={{ flex: 1 }}>
                <Card.Content style={{ alignItems: 'center' }}>
                  <IconButton icon="alert-circle" size={28} iconColor="#ef4444" style={{ margin: 0 }} />
                  <Text variant="titleMedium" style={{ fontWeight: 'bold', marginTop: 4 }}>
                    {repository.openIssuesCount.toLocaleString()}
                  </Text>
                  <Text variant="labelSmall" style={{ opacity: 0.7 }}>
                    Issues
                  </Text>
                </Card.Content>
              </Card>
            </View>

            {/* Language */}
            {repository.primaryLanguage && (
              <Card mode="contained">
                <Card.Content>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                      Primary Language
                    </Text>
                    <LanguageTag language={repository.primaryLanguage} />
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* Topics */}
            {repository.topics && repository.topics.length > 0 && (
              <Card mode="contained">
                <Card.Content>
                  <Text variant="bodyMedium" style={{ fontWeight: '600', marginBottom: 12 }}>
                    Topics
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {repository.topics.map((topic) => (
                      <Chip
                        key={topic}
                        icon="tag"
                        onPress={() => router.push(`/topic/${topic}`)}
                        mode="outlined"
                      >
                        {topic}
                      </Chip>
                    ))}
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button
                mode={isStarred ? 'outlined' : 'contained'}
                onPress={handleStar}
                icon={isStarred ? 'star' : 'star-outline'}
                style={{ flex: 1 }}
              >
                {isStarred ? 'Starred' : 'Star'}
              </Button>

              <Button
                mode="outlined"
                onPress={handleOpenInBrowser}
                icon="open-in-new"
              >
                Open
              </Button>
            </View>

            {/* README Section */}
            <Card mode="contained">
              <Card.Content>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <IconButton icon="text-box-outline" size={20} style={{ margin: 0, marginRight: 4 }} />
                  <Text variant="titleSmall" style={{ fontWeight: '600' }}>
                    README
                  </Text>
                </View>
                <Text variant="bodyMedium" style={{ opacity: 0.7 }}>
                  README content would be rendered here with markdown support.
                </Text>
              </Card.Content>
            </Card>
          </View>
        </ScrollView>
      </Surface>
    </SafeAreaView>
  );
}
