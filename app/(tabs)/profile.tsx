import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { UserProfile } from '@/components/features/user/UserProfile';
import type { User } from '@/types/models';

export default function ProfileScreen() {
  const router = useRouter();

  // Mock user data - in production, this would come from auth store or React Query
  const mockUser: User = {
    id: '1',
    githubId: '123456',
    login: 'octocat',
    name: 'The Octocat',
    email: 'octocat@github.com',
    avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
    bio: 'GitHub mascot and passionate developer',
    company: '@GitHub',
    location: 'San Francisco, CA',
    blog: 'https://github.blog',
    twitterUsername: 'github',
    publicRepos: 42,
    publicGists: 8,
    followers: 1234,
    following: 56,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handleStatsPress = (type: 'repos' | 'followers' | 'following') => {
    console.log('Navigate to:', type);
    // Navigate to respective screens
  };

  const handleSettings = () => {
    console.log('Navigate to settings');
    // Navigate to settings screen
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement sign out logic
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-dark-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-4">
            <Text variant="heading" weight="bold">
              Profile
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={handleSettings}
            >
              <Ionicons name="settings-outline" size={24} color="#ffffff" />
            </Button>
          </View>
        </View>

        {/* User Profile */}
        <View className="px-4">
          <UserProfile user={mockUser} onStatsPress={handleStatsPress} />
        </View>

        {/* Settings Options */}
        <View className="px-4 mt-4 space-y-3">
          <Card variant="elevated" pressable onPress={handleSettings}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-primary-600/20 items-center justify-center mr-3">
                  <Ionicons name="settings-outline" size={20} color="#0284c7" />
                </View>
                <Text variant="body" weight="medium">
                  Settings
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#71717a" />
            </View>
          </Card>

          <Card
            variant="elevated"
            pressable
            onPress={() => console.log('Navigate to starred repositories')}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-yellow-500/20 items-center justify-center mr-3">
                  <Ionicons name="star" size={20} color="#fbbf24" />
                </View>
                <Text variant="body" weight="medium">
                  Starred Repositories
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#71717a" />
            </View>
          </Card>

          <Card
            variant="elevated"
            pressable
            onPress={() => console.log('Navigate to notifications')}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-secondary-600/20 items-center justify-center mr-3">
                  <Ionicons name="notifications-outline" size={20} color="#d946ef" />
                </View>
                <Text variant="body" weight="medium">
                  Notifications
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#71717a" />
            </View>
          </Card>
        </View>

        {/* Sign Out Button */}
        <View className="px-4 mt-6 mb-8">
          <Button variant="outline" onPress={handleSignOut}>
            <View className="flex-row items-center">
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text color="error" weight="semibold" className="ml-2">
                Sign Out
              </Text>
            </View>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
