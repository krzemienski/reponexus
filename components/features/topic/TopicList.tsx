import React, { useState } from 'react';
import { View, RefreshControl, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  GestureHandlerRootView,
  Swipeable,
  RectButton,
} from 'react-native-gesture-handler';
import Animated, { FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { TopicCard } from './TopicCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Text } from '@/components/ui/Text';
import type { Topic } from '@/types/models';

interface TopicListProps {
  topics: Topic[];
  isLoading?: boolean;
  isError?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onFollow?: (topicId: string) => void;
  onUnfollow?: (topicId: string) => void;
  onDelete?: (topicId: string) => void;
  showFollowButton?: boolean;
  allowSwipeDelete?: boolean;
  errorType?: 'network' | 'server' | 'notFound' | 'unauthorized' | 'general';
  onRetry?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
}

export const TopicList: React.FC<TopicListProps> = ({
  topics,
  isLoading = false,
  isError = false,
  isRefreshing = false,
  onRefresh,
  onFollow,
  onUnfollow,
  onDelete,
  showFollowButton = true,
  allowSwipeDelete = false,
  errorType = 'general',
  onRetry,
  emptyTitle = 'No topics found',
  emptyMessage = 'Start following topics to see them here.',
  emptyActionLabel = 'Explore Topics',
  onEmptyAction,
}) => {
  const [deletedTopics, setDeletedTopics] = useState<Set<string>>(new Set());

  const renderRightActions = (topicId: string) => {
    return (
      <View className="flex-row items-center">
        <RectButton
          style={{
            backgroundColor: '#ef4444',
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
            height: '100%',
            borderRadius: 12,
            marginLeft: 8,
          }}
          onPress={() => handleDelete(topicId)}
        >
          <Ionicons name="trash" size={24} color="#ffffff" />
          <Text variant="caption" className="mt-1">
            Delete
          </Text>
        </RectButton>
      </View>
    );
  };

  const handleDelete = (topicId: string) => {
    Alert.alert(
      'Unfollow Topic',
      'Are you sure you want to unfollow this topic?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unfollow',
          style: 'destructive',
          onPress: () => {
            setDeletedTopics((prev) => new Set(prev).add(topicId));
            setTimeout(() => {
              onDelete?.(topicId);
            }, 300);
          },
        },
      ]
    );
  };

  const handleFollow = (topicId: string, isFollowed: boolean) => {
    if (isFollowed) {
      onUnfollow?.(topicId);
    } else {
      onFollow?.(topicId);
    }
  };

  // Show error state
  if (isError && topics.length === 0) {
    return <ErrorState type={errorType} onRetry={onRetry} />;
  }

  // Show empty state
  if (topics.length === 0 && !isLoading) {
    return (
      <EmptyState
        icon="pricetags-outline"
        title={emptyTitle}
        message={emptyMessage}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  const renderItem = ({ item }: { item: Topic }) => {
    // Don't render deleted topics
    if (deletedTopics.has(item.id)) {
      return null;
    }

    const content = (
      <Animated.View exiting={FadeOut.duration(300)} className="mb-4">
        <TopicCard
          topic={item}
          onFollow={
            onFollow || onUnfollow
              ? () => handleFollow(item.id, item.isFollowed)
              : undefined
          }
          showFollowButton={showFollowButton}
        />
      </Animated.View>
    );

    if (allowSwipeDelete && item.isFollowed) {
      return (
        <Swipeable
          renderRightActions={() => renderRightActions(item.id)}
          overshootRight={false}
          friction={2}
        >
          {content}
        </Swipeable>
      );
    }

    return content;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FlashList
        data={topics}
        renderItem={renderItem}
        estimatedItemSize={150}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#0284c7"
              colors={['#0284c7']}
            />
          ) : undefined
        }
      />
    </GestureHandlerRootView>
  );
};

export default TopicList;
