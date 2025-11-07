import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import type { Topic } from '@/types/models';

interface TopicCardProps {
  topic: Topic;
  onFollow?: () => void;
  showFollowButton?: boolean;
}

const TOPIC_EMOJIS: Record<string, string> = {
  react: '⚛️',
  javascript: '🟨',
  typescript: '🔷',
  python: '🐍',
  go: '🐹',
  rust: '🦀',
  java: '☕',
  'machine-learning': '🤖',
  'artificial-intelligence': '🧠',
  blockchain: '⛓️',
  cloud: '☁️',
  devops: '🔧',
  mobile: '📱',
  web: '🌐',
  gaming: '🎮',
  security: '🔒',
  database: '💾',
  frontend: '🎨',
  backend: '⚙️',
};

export const TopicCard: React.FC<TopicCardProps> = ({
  topic,
  onFollow,
  showFollowButton = true,
}) => {
  const router = useRouter();
  const followScale = useSharedValue(1);

  const handlePress = () => {
    router.push(`/topic/${topic.name}`);
  };

  const handleFollowPress = (e: any) => {
    e.stopPropagation();
    followScale.value = withSpring(1.2, {}, () => {
      followScale.value = withSpring(1);
    });
    onFollow?.();
  };

  const followAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: followScale.value }],
    };
  });

  const getTopicEmoji = (name: string) => {
    return TOPIC_EMOJIS[name.toLowerCase()] || '📦';
  };

  return (
    <Card variant="elevated" pressable onPress={handlePress}>
      <View className="space-y-3">
        {/* Topic Icon and Name */}
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 rounded-full bg-primary-600/20 items-center justify-center mr-3">
              <Text variant="title">{getTopicEmoji(topic.name)}</Text>
            </View>

            <View className="flex-1">
              <Text variant="title" weight="bold" className="mb-1">
                {topic.displayName}
              </Text>
              <Text variant="caption" color="gray">
                {topic.name}
              </Text>
            </View>
          </View>

          {showFollowButton && topic.isFollowed && (
            <View className="ml-2">
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </View>
          )}
        </View>

        {/* Description */}
        {topic.description && (
          <Text color="gray" variant="body" numberOfLines={2}>
            {topic.description}
          </Text>
        )}

        {/* Repository Count */}
        <View className="flex-row items-center">
          <Ionicons name="git-branch" size={16} color="#71717a" />
          <Text color="gray" variant="caption" className="ml-1">
            {topic.repositoryCount.toLocaleString()} repositories
          </Text>
        </View>

        {/* Follow Button */}
        {showFollowButton && onFollow && (
          <Animated.View style={followAnimatedStyle}>
            <Button
              variant={topic.isFollowed ? 'outline' : 'primary'}
              size="sm"
              onPress={handleFollowPress}
            >
              {topic.isFollowed ? 'Following' : 'Follow'}
            </Button>
          </Animated.View>
        )}
      </View>
    </Card>
  );
};

export default TopicCard;
