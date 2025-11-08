import React, { useState } from 'react';
import { View, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text, Button, Surface, List, Avatar, Divider, IconButton, ProgressBar } from 'react-native-paper';
import { UserProfile } from '@/components/features/user/UserProfile';
import { useCurrentUser } from '@/hooks/queries';
import { useUserSyncStatus, useSyncWithStatus } from '@/hooks/queries/useSync';
import type { User } from '@/types/models';

export default function ProfileScreen() {
  const router = useRouter();

  // Fetch current user data from API
  const { data: user, isLoading, isError, error } = useCurrentUser();

  // Sync status and functionality
  const { data: syncStatus } = useUserSyncStatus();
  const {
    triggerSync,
    isLoading: isSyncing,
    isSuccess: syncSuccess,
    result: syncResult,
    error: syncError,
  } = useSyncWithStatus();

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

  const handleSyncStarred = () => {
    Alert.alert(
      'Sync Starred Repos',
      'This will fetch all your starred repositories from GitHub and generate topic suggestions. This may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync Now',
          onPress: () => {
            triggerSync({});
          },
        },
      ]
    );
  };

  const handleViewSuggestions = () => {
    router.push('/suggestions');
  };

  // Format last sync time
  const formatLastSync = (dateString?: string) => {
    if (!dateString) return 'Never synced';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Surface style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
          <Text variant="bodyMedium" style={{ marginTop: 16, opacity: 0.7 }}>
            Loading profile...
          </Text>
        </Surface>
      </SafeAreaView>
    );
  }

  // Error state
  if (isError || !user) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Surface style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <IconButton icon="alert-circle" size={48} iconColor="#ef4444" />
          <Text variant="titleLarge" style={{ fontWeight: 'bold', marginTop: 16, textAlign: 'center' }}>
            Failed to Load Profile
          </Text>
          <Text variant="bodyMedium" style={{ marginTop: 8, opacity: 0.7, textAlign: 'center' }}>
            {error?.message || 'Unable to fetch user data. Please try again.'}
          </Text>
          <Button mode="contained" onPress={() => router.replace('/(auth)/login')} style={{ marginTop: 24 }}>
            Sign In
          </Button>
        </Surface>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Surface style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ padding: 16, paddingTop: 16, paddingBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>
                Profile
              </Text>
              <IconButton
                icon="cog-outline"
                size={24}
                onPress={handleSettings}
              />
            </View>
          </View>

          {/* User Profile Card */}
          <Surface style={{ margin: 16, borderRadius: 12, elevation: 2, padding: 16 }}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Avatar.Image
                size={80}
                source={{ uri: user.avatarUrl }}
                style={{ marginBottom: 12 }}
              />
              <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>
                {user.name}
              </Text>
              <Text variant="bodyMedium" style={{ opacity: 0.7, marginTop: 4 }}>
                @{user.login}
              </Text>
            </View>

            {user.bio && (
              <Text variant="bodyMedium" style={{ textAlign: 'center', marginBottom: 16, opacity: 0.8 }}>
                {user.bio}
              </Text>
            )}

            {/* User Info */}
            <View style={{ marginBottom: 16 }}>
              {user.company && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <IconButton icon="office-building" size={20} style={{ margin: 0, marginRight: 4 }} />
                  <Text variant="bodyMedium">{user.company}</Text>
                </View>
              )}
              {user.location && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <IconButton icon="map-marker" size={20} style={{ margin: 0, marginRight: 4 }} />
                  <Text variant="bodyMedium">{user.location}</Text>
                </View>
              )}
              {user.blog && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <IconButton icon="link" size={20} style={{ margin: 0, marginRight: 4 }} />
                  <Text variant="bodyMedium">{user.blog}</Text>
                </View>
              )}
              {user.twitterUsername && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <IconButton icon="twitter" size={20} style={{ margin: 0, marginRight: 4 }} />
                  <Text variant="bodyMedium">@{user.twitterUsername}</Text>
                </View>
              )}
            </View>

            <Divider style={{ marginVertical: 12 }} />

            {/* Stats */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center' }}>
                <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>
                  {user.publicRepos}
                </Text>
                <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                  Repositories
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>
                  {user.followers.toLocaleString()}
                </Text>
                <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                  Followers
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>
                  {user.following}
                </Text>
                <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                  Following
                </Text>
              </View>
            </View>
          </Surface>

          {/* Sync Status Card */}
          <Surface style={{ margin: 16, borderRadius: 12, elevation: 2, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                Starred Repos Sync
              </Text>
              {isSyncing && (
                <IconButton icon="sync" size={20} iconColor="#0ea5e9" />
              )}
            </View>

            {isSyncing && (
              <View style={{ marginBottom: 12 }}>
                <ProgressBar indeterminate color="#0ea5e9" />
                <Text variant="bodySmall" style={{ marginTop: 8, opacity: 0.7 }}>
                  Syncing your starred repositories...
                </Text>
              </View>
            )}

            {!isSyncing && syncSuccess && syncResult && (
              <View style={{ marginBottom: 12, padding: 12, backgroundColor: '#22c55e20', borderRadius: 8 }}>
                <Text variant="bodyMedium" style={{ color: '#22c55e', fontWeight: 'bold' }}>
                  Sync Complete!
                </Text>
                <Text variant="bodySmall" style={{ opacity: 0.7, marginTop: 4 }}>
                  {syncResult.totalStarred} repositories synced
                </Text>
              </View>
            )}

            {syncStatus && (
              <View style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text variant="bodyMedium" style={{ opacity: 0.7 }}>
                    Total Starred:
                  </Text>
                  <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>
                    {syncStatus.totalStarred}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodyMedium" style={{ opacity: 0.7 }}>
                    Last Sync:
                  </Text>
                  <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>
                    {formatLastSync(syncStatus.lastSyncAt)}
                  </Text>
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                mode="contained"
                onPress={handleSyncStarred}
                disabled={isSyncing}
                icon="sync"
                style={{ flex: 1 }}
                buttonColor="#0ea5e9"
              >
                {isSyncing ? 'Syncing...' : syncStatus?.hasSynced ? 'Re-sync' : 'Sync Now'}
              </Button>
              {syncStatus?.hasSynced && (
                <Button
                  mode="outlined"
                  onPress={handleViewSuggestions}
                  icon="lightbulb-outline"
                  style={{ flex: 1 }}
                >
                  Suggestions
                </Button>
              )}
            </View>
          </Surface>

          {/* Settings Options */}
          <View style={{ marginHorizontal: 16, marginTop: 8 }}>
            <List.Item
              title="Settings"
              description="Manage app preferences"
              left={props => <List.Icon {...props} icon="cog" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleSettings}
            />
            <Divider />
            <List.Item
              title="Starred Repositories"
              description="View your starred repos"
              left={props => <List.Icon {...props} icon="star" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => console.log('Navigate to starred repositories')}
            />
            <Divider />
            <List.Item
              title="Notifications"
              description="Manage notifications"
              left={props => <List.Icon {...props} icon="bell-outline" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => console.log('Navigate to notifications')}
            />
          </View>

          {/* Sign Out Button */}
          <View style={{ padding: 16, marginTop: 8, marginBottom: 32 }}>
            <Button
              mode="outlined"
              onPress={handleSignOut}
              icon="logout"
              style={{ borderColor: '#ef4444' }}
              textColor="#ef4444"
            >
              Sign Out
            </Button>
          </View>
        </ScrollView>
      </Surface>
    </SafeAreaView>
  );
}
