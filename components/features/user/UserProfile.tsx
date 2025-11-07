import React from 'react';
import { View, Linking, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { StatsGrid } from './StatsGrid';
import type { User } from '@/types/models';

interface UserProfileProps {
  user: User;
  onStatsPress?: (type: 'repos' | 'followers' | 'following') => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onStatsPress,
}) => {
  const handleLinkPress = (url?: string) => {
    if (url) {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      Linking.openURL(fullUrl);
    }
  };

  return (
    <View className="space-y-4">
      {/* Profile Header with Gradient Border */}
      <Card variant="elevated">
        <View className="items-center">
          {/* Avatar with Gradient Border */}
          <View className="mb-4">
            <LinearGradient
              colors={['#0284c7', '#d946ef']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                padding: 4,
                borderRadius: 9999,
              }}
            >
              <View
                className="bg-dark-100 rounded-full"
                style={{ padding: 2 }}
              >
                <Avatar
                  source={user.avatarUrl}
                  name={user.name || user.login}
                  size="xl"
                />
              </View>
            </LinearGradient>
          </View>

          {/* Name and Username */}
          <View className="items-center mb-4">
            {user.name && (
              <Text variant="title" weight="bold" className="mb-1">
                {user.name}
              </Text>
            )}
            <Text variant="body" color="gray">
              @{user.login}
            </Text>
          </View>

          {/* Bio */}
          {user.bio && (
            <Text
              variant="body"
              color="gray"
              className="text-center mb-4"
            >
              {user.bio}
            </Text>
          )}

          {/* Stats Grid */}
          <StatsGrid user={user} onStatsPress={onStatsPress} />
        </View>
      </Card>

      {/* Additional Info */}
      <Card variant="elevated">
        <View className="space-y-3">
          {user.company && (
            <View className="flex-row items-center">
              <Ionicons name="business" size={20} color="#71717a" />
              <Text color="gray" className="ml-3">
                {user.company}
              </Text>
            </View>
          )}

          {user.location && (
            <View className="flex-row items-center">
              <Ionicons name="location" size={20} color="#71717a" />
              <Text color="gray" className="ml-3">
                {user.location}
              </Text>
            </View>
          )}

          {user.blog && (
            <Pressable
              className="flex-row items-center"
              onPress={() => handleLinkPress(user.blog)}
            >
              <Ionicons name="link" size={20} color="#0284c7" />
              <Text color="primary" className="ml-3">
                {user.blog}
              </Text>
            </Pressable>
          )}

          {user.twitterUsername && (
            <Pressable
              className="flex-row items-center"
              onPress={() =>
                handleLinkPress(`https://twitter.com/${user.twitterUsername}`)
              }
            >
              <Ionicons name="logo-twitter" size={20} color="#0284c7" />
              <Text color="primary" className="ml-3">
                @{user.twitterUsername}
              </Text>
            </Pressable>
          )}

          {user.email && (
            <Pressable
              className="flex-row items-center"
              onPress={() => handleLinkPress(`mailto:${user.email}`)}
            >
              <Ionicons name="mail" size={20} color="#0284c7" />
              <Text color="primary" className="ml-3">
                {user.email}
              </Text>
            </Pressable>
          )}
        </View>
      </Card>
    </View>
  );
};

export default UserProfile;
