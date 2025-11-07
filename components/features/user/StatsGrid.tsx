import React, { useEffect } from 'react';
import { View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import type { User } from '@/types/models';

const AnimatedText = Animated.createAnimatedComponent(Text);

interface StatItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  onPress?: () => void;
}

const StatItem: React.FC<StatItemProps> = ({ icon, label, value, onPress }) => {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  const Content = (
    <View className="items-center py-3 px-4 flex-1">
      <View className="w-12 h-12 rounded-full bg-primary-600/20 items-center justify-center mb-2">
        <Ionicons name={icon} size={24} color="#0284c7" />
      </View>
      <Text variant="title" weight="bold" className="mb-1">
        {value.toLocaleString()}
      </Text>
      <Text variant="caption" color="gray">
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className="flex-1"
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
        })}
      >
        {Content}
      </Pressable>
    );
  }

  return Content;
};

interface StatsGridProps {
  user: User;
  onStatsPress?: (type: 'repos' | 'followers' | 'following') => void;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ user, onStatsPress }) => {
  return (
    <View className="w-full">
      <View className="flex-row border-t border-b border-dark-200">
        <StatItem
          icon="git-branch"
          label="Repositories"
          value={user.publicRepos}
          onPress={onStatsPress ? () => onStatsPress('repos') : undefined}
        />
        <View className="w-px bg-dark-200" />
        <StatItem
          icon="people"
          label="Followers"
          value={user.followers}
          onPress={onStatsPress ? () => onStatsPress('followers') : undefined}
        />
        <View className="w-px bg-dark-200" />
        <StatItem
          icon="person-add"
          label="Following"
          value={user.following}
          onPress={onStatsPress ? () => onStatsPress('following') : undefined}
        />
      </View>

      {user.publicGists > 0 && (
        <View className="flex-row border-b border-dark-200 justify-center">
          <StatItem
            icon="code-slash"
            label="Gists"
            value={user.publicGists}
          />
        </View>
      )}
    </View>
  );
};

export default StatsGrid;
