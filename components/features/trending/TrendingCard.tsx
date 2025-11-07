import React, { useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import type { TrendingItem } from '@/types/models';

interface TrendingCardProps {
  item: TrendingItem;
  previousRank?: number;
}

export const TrendingCard: React.FC<TrendingCardProps> = ({
  item,
  previousRank,
}) => {
  const router = useRouter();
  const rankScale = useSharedValue(1);

  const getRankChange = () => {
    if (!previousRank) return null;
    const change = previousRank - item.rank;
    if (change > 0) return { direction: 'up' as const, value: change };
    if (change < 0) return { direction: 'down' as const, value: Math.abs(change) };
    return { direction: 'same' as const, value: 0 };
  };

  const rankChange = getRankChange();

  useEffect(() => {
    if (rankChange && rankChange.direction !== 'same') {
      rankScale.value = withSpring(1.2, {}, () => {
        rankScale.value = withSpring(1);
      });
    }
  }, [item.rank]);

  const rankAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: rankScale.value }],
    };
  });

  const handlePress = () => {
    router.push(`/repository/${item.repository.id}`);
  };

  const truncateDescription = (desc: string, maxLength: number = 100) => {
    if (desc.length <= maxLength) return desc;
    return desc.substring(0, maxLength) + '...';
  };

  return (
    <Card variant="elevated" pressable onPress={handlePress}>
      <View className="space-y-3">
        {/* Rank and Trending Indicator */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-3">
            <Animated.View
              style={rankAnimatedStyle}
              className="w-10 h-10 rounded-full bg-primary-600 items-center justify-center"
            >
              <Text variant="body" weight="bold">
                {item.rank}
              </Text>
            </Animated.View>

            {rankChange && rankChange.direction !== 'same' && (
              <View className="flex-row items-center">
                <Ionicons
                  name={rankChange.direction === 'up' ? 'arrow-up' : 'arrow-down'}
                  size={16}
                  color={rankChange.direction === 'up' ? '#10b981' : '#ef4444'}
                />
                <Text
                  color={rankChange.direction === 'up' ? 'success' : 'error'}
                  variant="caption"
                  weight="semibold"
                >
                  {rankChange.value}
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center">
            <Ionicons name="trending-up" size={20} color="#0284c7" />
            <Text color="primary" variant="body" weight="semibold" className="ml-1">
              {item.starsToday.toLocaleString()}
            </Text>
            <Text color="gray" variant="caption" className="ml-1">
              today
            </Text>
          </View>
        </View>

        {/* Repository Name and Owner */}
        <View>
          <Text variant="body" weight="medium" color="gray" className="mb-1">
            {item.repository.ownerLogin}
          </Text>
          <Text variant="title" weight="bold">
            {item.repository.name}
          </Text>
        </View>

        {/* Description */}
        {item.repository.description && (
          <Text color="gray" variant="body">
            {truncateDescription(item.repository.description)}
          </Text>
        )}

        {/* Stats and Language */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-4">
            <View className="flex-row items-center">
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text color="gray" variant="caption" className="ml-1">
                {item.repository.stargazerCount.toLocaleString()}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Ionicons name="git-branch" size={16} color="#71717a" />
              <Text color="gray" variant="caption" className="ml-1">
                {item.repository.forkCount.toLocaleString()}
              </Text>
            </View>
          </View>

          {item.language && (
            <Badge variant="info" size="sm">
              {item.language}
            </Badge>
          )}
        </View>

        {/* Built By Developers */}
        {item.builtBy && item.builtBy.length > 0 && (
          <View className="flex-row items-center">
            <Text color="gray" variant="caption" className="mr-2">
              Built by
            </Text>
            <View className="flex-row -space-x-2">
              {item.builtBy.slice(0, 5).map((dev, index) => (
                <View key={dev.username} style={{ zIndex: 10 - index }}>
                  <Avatar
                    source={{ uri: dev.avatar }}
                    name={dev.username}
                    size="sm"
                  />
                </View>
              ))}
            </View>
            {item.builtBy.length > 5 && (
              <Text color="gray" variant="caption" className="ml-2">
                +{item.builtBy.length - 5} more
              </Text>
            )}
          </View>
        )}

        {/* Topics */}
        {item.repository.topics && item.repository.topics.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-1"
          >
            <View className="flex-row space-x-2 px-1">
              {item.repository.topics.slice(0, 5).map((topic) => (
                <Chip
                  key={topic}
                  label={topic}
                  icon="pricetag"
                  onPress={() => {}}
                />
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </Card>
  );
};

export default TrendingCard;
