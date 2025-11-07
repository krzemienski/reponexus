import React, { useEffect } from 'react';
import { View, ActivityIndicator, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = '#0284c7',
}) => {
  return (
    <View className="items-center justify-center p-4">
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      className="bg-dark-200"
      style={[
        {
          width,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

interface ShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Shimmer: React.FC<ShimmerProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const translateX = useSharedValue(-300);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(300, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View
      className="bg-dark-200 overflow-hidden"
      style={[
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View style={[{ width: '100%', height: '100%' }, animatedStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: '100%', height: '100%' }}
        />
      </Animated.View>
    </View>
  );
};

interface LoadingProps {
  variant?: 'spinner' | 'skeleton' | 'shimmer';
  size?: 'small' | 'large';
  color?: string;
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Loading: React.FC<LoadingProps> = ({
  variant = 'spinner',
  ...props
}) => {
  switch (variant) {
    case 'skeleton':
      return <Skeleton {...props} />;
    case 'shimmer':
      return <Shimmer {...props} />;
    default:
      return <LoadingSpinner {...props} />;
  }
};

export default Loading;
