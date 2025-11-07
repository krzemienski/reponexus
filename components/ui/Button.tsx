import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  PressableProps,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { pressScale } from '@/utils/animations';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  hapticFeedback?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 border-primary-600',
  secondary: 'bg-secondary-600 border-secondary-600',
  outline: 'bg-transparent border-primary-600',
  ghost: 'bg-transparent border-transparent',
};

const variantTextStyles: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-white',
  outline: 'text-primary-600',
  ghost: 'text-primary-600',
};

const sizeStyles: Record<ButtonSize, { container: string; text: string }> = {
  sm: {
    container: 'px-3 py-2 rounded-md',
    text: 'text-sm',
  },
  md: {
    container: 'px-4 py-3 rounded-lg',
    text: 'text-base',
  },
  lg: {
    container: 'px-6 py-4 rounded-xl',
    text: 'text-lg',
  },
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  style,
  hapticFeedback = true,
  onPress,
  ...props
}) => {
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    if (!isDisabled) {
      scale.value = withSpring(0.95);
      if (hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handlePressOut = () => {
    if (!isDisabled) {
      scale.value = withSpring(1);
    }
  };

  const handlePress = (e: any) => {
    if (!isDisabled && onPress) {
      if (hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onPress(e);
    }
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={isDisabled}
      className={`
        flex-row items-center justify-center border-2
        ${variantStyles[variant]}
        ${sizeStyles[size].container}
        ${isDisabled ? 'opacity-50' : ''}
      `}
      style={[animatedStyle, style]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? '#0284c7' : '#ffffff'}
        />
      ) : (
        <Text
          className={`
            font-semibold text-center
            ${variantTextStyles[variant]}
            ${sizeStyles[size].text}
          `}
        >
          {children}
        </Text>
      )}
    </AnimatedPressable>
  );
};

export default Button;
