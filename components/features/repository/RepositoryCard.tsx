import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { Shimmer } from '@/components/ui/Loading';
import { TrendingBadge } from '@/components/features/trending/TrendingBadge';
import type { Repository } from '@/types/models';

interface RepositoryCardProps {
  repository: Repository & {
    trending_score?: number;
    trending_time_window?: string;
  };
  onStar?: () => void;
  isStarred?: boolean;
  showTrending?: boolean;
}

export const RepositoryCard: React.FC<RepositoryCardProps> = ({
  repository,
  onStar,
  isStarred = false,
  showTrending = false,
}) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/repository/${repository.id}`);
  };

  const handleStarPress = (e: any) => {
    e.stopPropagation();
    onStar?.();
  };

  const truncateDescription = (desc: string, maxLength: number = 100) => {
    if (desc.length <= maxLength) return desc;
    return desc.substring(0, maxLength) + '...';
  };

  return (
    <Card variant="elevated" pressable onPress={handlePress}>
      <View className="space-y-3">
        {/* Repository Name and Owner */}
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text variant="body" weight="semibold" className="mb-1">
              {repository.ownerLogin}
            </Text>
            <Text variant="title" weight="bold">
              {repository.name}
            </Text>
          </View>

          <View className="flex-row items-center space-x-2">
            {showTrending && repository.trending_score && (
              <TrendingBadge score={repository.trending_score} size="small" showLabel={false} />
            )}

            {onStar && (
              <Pressable onPress={handleStarPress} hitSlop={8}>
                <Ionicons
                  name={isStarred ? 'star' : 'star-outline'}
                  size={24}
                  color={isStarred ? '#fbbf24' : '#71717a'}
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* Description */}
        {repository.description && (
          <Text color="gray" variant="body">
            {truncateDescription(repository.description)}
          </Text>
        )}

        {/* Stats */}
        <View className="flex-row items-center space-x-4">
          <View className="flex-row items-center">
            <Ionicons name="star" size={16} color="#fbbf24" />
            <Text color="gray" variant="caption" className="ml-1">
              {repository.stargazerCount.toLocaleString()}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Ionicons name="git-branch" size={16} color="#71717a" />
            <Text color="gray" variant="caption" className="ml-1">
              {repository.forkCount.toLocaleString()}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Ionicons name="alert-circle" size={16} color="#71717a" />
            <Text color="gray" variant="caption" className="ml-1">
              {repository.openIssuesCount.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Language Badge */}
        {repository.primaryLanguage && (
          <View className="flex-row items-center">
            <Badge variant="info" size="sm">
              {repository.primaryLanguage}
            </Badge>
          </View>
        )}

        {/* Topics */}
        {repository.topics && repository.topics.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-1"
          >
            <View className="flex-row space-x-2 px-1">
              {repository.topics.slice(0, 5).map((topic) => (
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

export const RepositoryCardSkeleton: React.FC = () => {
  return (
    <Card variant="elevated">
      <View className="space-y-3">
        <View>
          <Shimmer width={100} height={16} />
          <View className="h-2" />
          <Shimmer width={200} height={24} />
        </View>

        <Shimmer width="100%" height={40} />

        <View className="flex-row items-center space-x-4">
          <Shimmer width={60} height={20} />
          <Shimmer width={60} height={20} />
          <Shimmer width={60} height={20} />
        </View>

        <Shimmer width={80} height={24} borderRadius={12} />

        <View className="flex-row space-x-2">
          <Shimmer width={60} height={28} borderRadius={14} />
          <Shimmer width={70} height={28} borderRadius={14} />
          <Shimmer width={80} height={28} borderRadius={14} />
        </View>
      </View>
    </Card>
  );
};

export default RepositoryCard;
