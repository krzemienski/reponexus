import React from 'react';
import { Pressable, PressableProps, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CardVariant = 'elevated' | 'flat' | 'outlined';

interface CardProps extends Omit<PressableProps, 'style'> {
  variant?: CardVariant;
  children: React.ReactNode;
  style?: ViewStyle;
  pressable?: boolean;
  hapticFeedback?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  elevated: 'bg-dark-100 shadow-lg shadow-black/50',
  flat: 'bg-dark-100',
  outlined: 'bg-transparent border border-dark-200',
};

export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  children,
  style,
  pressable = false,
  hapticFeedback = true,
  onPress,
  ...props
}) => {
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(variant === 'elevated' ? 0.5 : 0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      shadowOpacity: shadowOpacity.value,
    };
  });

  const handlePressIn = () => {
    if (pressable && onPress) {
      scale.value = withSpring(0.98);
      if (variant === 'elevated') {
        shadowOpacity.value = withTiming(0.7);
      }
      if (hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handlePressOut = () => {
    if (pressable && onPress) {
      scale.value = withSpring(1);
      if (variant === 'elevated') {
        shadowOpacity.value = withTiming(0.5);
      }
    }
  };

  const handlePress = (e: any) => {
    if (onPress) {
      if (hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onPress(e);
    }
  };

  const Component = pressable && onPress ? AnimatedPressable : Animated.View;

  return (
    <Component
      onPressIn={pressable ? handlePressIn : undefined}
      onPressOut={pressable ? handlePressOut : undefined}
      onPress={pressable ? handlePress : undefined}
      className={`rounded-lg p-4 ${variantStyles[variant]}`}
      style={[animatedStyle, style]}
      {...(pressable ? props : {})}
    >
      {children}
    </Component>
  );
};

export default Card;
