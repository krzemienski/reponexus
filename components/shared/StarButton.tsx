import React from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface StarButtonProps {
  isStarred: boolean;
  onPress: () => void;
  size?: number;
  showCount?: boolean;
  count?: number;
}

export const StarButton: React.FC<StarButtonProps> = ({
  isStarred,
  onPress,
  size = 24,
  showCount = false,
  count = 0,
}) => {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
    };
  });

  const handlePress = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animation
    scale.value = withSequence(
      withSpring(1.3, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );

    rotate.value = withSequence(
      withSpring(-15, { damping: 10 }),
      withSpring(15, { damping: 10 }),
      withSpring(0, { damping: 10 })
    );

    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      className="flex-row items-center"
    >
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={isStarred ? 'star' : 'star-outline'}
          size={size}
          color={isStarred ? '#fbbf24' : '#71717a'}
        />
      </Animated.View>

      {showCount && count > 0 && (
        <Animated.Text
          style={animatedStyle}
          className={`ml-1 text-sm font-medium ${
            isStarred ? 'text-yellow-400' : 'text-dark-400'
          }`}
        >
          {count.toLocaleString()}
        </Animated.Text>
      )}
    </Pressable>
  );
};

export default StarButton;
