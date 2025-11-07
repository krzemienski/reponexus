import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { Button } from './Button';

type ErrorType = 'network' | 'server' | 'notFound' | 'unauthorized' | 'general';

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: ViewStyle;
}

const errorConfig: Record<
  ErrorType,
  { icon: keyof typeof Ionicons.glyphMap; title: string; message: string }
> = {
  network: {
    icon: 'cloud-offline-outline',
    title: 'No Internet Connection',
    message: 'Please check your internet connection and try again.',
  },
  server: {
    icon: 'server-outline',
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.',
  },
  notFound: {
    icon: 'search-outline',
    title: 'Not Found',
    message: 'The content you are looking for could not be found.',
  },
  unauthorized: {
    icon: 'lock-closed-outline',
    title: 'Unauthorized',
    message: 'You do not have permission to access this content.',
  },
  general: {
    icon: 'alert-circle-outline',
    title: 'Error',
    message: 'An unexpected error occurred. Please try again.',
  },
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  type = 'general',
  title,
  message,
  onRetry,
  retryLabel = 'Try Again',
  style,
}) => {
  const config = errorConfig[type];

  return (
    <View className="flex-1 items-center justify-center p-8" style={style}>
      <View className="w-24 h-24 rounded-full bg-red-500/20 items-center justify-center mb-4">
        <Ionicons name={config.icon} size={48} color="#ef4444" />
      </View>

      <Text variant="title" weight="semibold" className="mb-2 text-center">
        {title || config.title}
      </Text>

      <Text color="gray" className="text-center mb-6 max-w-sm">
        {message || config.message}
      </Text>

      {onRetry && (
        <Button onPress={onRetry} variant="primary" size="md">
          {retryLabel}
        </Button>
      )}
    </View>
  );
};

export default ErrorState;
