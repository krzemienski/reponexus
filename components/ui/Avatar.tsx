import React, { useState } from 'react';
import { View, Image, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type StatusIndicator = 'online' | 'offline' | 'away' | 'busy' | null;

interface AvatarProps {
  source?: string | { uri: string };
  name?: string;
  size?: AvatarSize;
  status?: StatusIndicator;
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; status: string }> = {
  xs: {
    container: 'w-6 h-6',
    text: 'text-xs',
    status: 'w-1.5 h-1.5',
  },
  sm: {
    container: 'w-8 h-8',
    text: 'text-sm',
    status: 'w-2 h-2',
  },
  md: {
    container: 'w-12 h-12',
    text: 'text-base',
    status: 'w-3 h-3',
  },
  lg: {
    container: 'w-16 h-16',
    text: 'text-lg',
    status: 'w-4 h-4',
  },
  xl: {
    container: 'w-24 h-24',
    text: 'text-2xl',
    status: 'w-5 h-5',
  },
};

const statusColors: Record<Exclude<StatusIndicator, null>, string> = {
  online: 'bg-green-500',
  offline: 'bg-gray-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name = '',
  size = 'md',
  status = null,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const showImage = source && !imageError;
  const imageUri = typeof source === 'string' ? source : source?.uri;

  return (
    <View className="relative">
      <View
        className={`
          ${sizeStyles[size].container}
          rounded-full
          items-center
          justify-center
          overflow-hidden
          ${!showImage ? 'bg-primary-600' : 'bg-dark-200'}
        `}
      >
        {showImage ? (
          <>
            {imageLoading && (
              <View className="absolute inset-0 bg-dark-200 items-center justify-center">
                <Text className={`text-dark-500 font-semibold ${sizeStyles[size].text}`}>
                  {name ? getInitials(name) : '?'}
                </Text>
              </View>
            )}
            <Animated.Image
              source={{ uri: imageUri }}
              className="w-full h-full"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
              entering={FadeIn.duration(300)}
            />
          </>
        ) : (
          <Text className={`text-white font-semibold ${sizeStyles[size].text}`}>
            {name ? getInitials(name) : '?'}
          </Text>
        )}
      </View>

      {status && (
        <View
          className={`
            absolute bottom-0 right-0
            ${sizeStyles[size].status}
            rounded-full
            border-2 border-dark-50
            ${statusColors[status]}
          `}
        />
      )}
    </View>
  );
};

export default Avatar;
