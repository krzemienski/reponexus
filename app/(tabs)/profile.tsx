import React from 'react';
import { View, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text, Button, Surface, List, Avatar, Divider, IconButton } from 'react-native-paper';
import { UserProfile } from '@/components/features/user/UserProfile';
import { useCurrentUser } from '@/hooks/queries';
import type { User } from '@/types/models';

export default function ProfileScreen() {
  const router = useRouter();

  // Fetch current user data from API
  const { data: user, isLoading, isError, error } = useCurrentUser();

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
