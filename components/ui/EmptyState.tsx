import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'folder-open-outline',
  title = 'No items found',
  message = 'There are no items to display at the moment.',
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <View className="flex-1 items-center justify-center p-8" style={style}>
      <View className="w-24 h-24 rounded-full bg-dark-200 items-center justify-center mb-4">
        <Ionicons name={icon} size={48} color="#71717a" />
      </View>

      <Text variant="title" weight="semibold" className="mb-2 text-center">
        {title}
      </Text>

      <Text color="gray" className="text-center mb-6 max-w-sm">
        {message}
      </Text>

      {actionLabel && onAction && (
        <Button onPress={onAction} variant="primary" size="md">
          {actionLabel}
        </Button>
      )}
    </View>
  );
};

export default EmptyState;
