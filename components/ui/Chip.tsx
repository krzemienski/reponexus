import React from 'react';
import { Pressable, Text, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ChipProps {
  label: string;
  selected?: boolean;
  removable?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  onRemove?: () => void;
  style?: ViewStyle;
  hapticFeedback?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  removable = false,
  icon,
  onPress,
  onRemove,
  style,
  hapticFeedback = true,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    if (onPress) {
      if (hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onPress();
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      if (hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onRemove();
    }
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={!onPress}
      className={`
        flex-row items-center px-3 py-2 rounded-full
        ${selected ? 'bg-primary-600' : 'bg-dark-200'}
      `}
      style={[animatedStyle, style]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={selected ? '#ffffff' : '#71717a'}
          style={{ marginRight: 6 }}
        />
      )}

      <Text
        className={`
          font-medium text-sm
          ${selected ? 'text-white' : 'text-dark-400'}
        `}
      >
        {label}
      </Text>

      {removable && (
        <Pressable
          onPress={handleRemove}
          hitSlop={8}
          className="ml-2"
        >
          <Ionicons
            name="close-circle"
            size={16}
            color={selected ? '#ffffff' : '#71717a'}
          />
        </Pressable>
      )}
    </AnimatedPressable>
  );
};

export default Chip;
