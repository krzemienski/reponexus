import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  Pressable,
  Text,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

type InputVariant = 'default' | 'error' | 'success';

interface InputProps extends TextInputProps {
  variant?: InputVariant;
  label?: string;
  errorMessage?: string;
  successMessage?: string;
  prefixIcon?: keyof typeof Ionicons.glyphMap;
  suffixIcon?: keyof typeof Ionicons.glyphMap;
  showClearButton?: boolean;
  onClear?: () => void;
}

const variantStyles: Record<InputVariant, { border: string; text: string }> = {
  default: {
    border: 'border-dark-200',
    text: 'text-white',
  },
  error: {
    border: 'border-red-500',
    text: 'text-white',
  },
  success: {
    border: 'border-green-500',
    text: 'text-white',
  },
};

export const Input: React.FC<InputProps> = ({
  variant = 'default',
  label,
  errorMessage,
  successMessage,
  prefixIcon,
  suffixIcon,
  showClearButton = true,
  onClear,
  value,
  onChangeText,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const borderWidth = useSharedValue(1);

  const animatedBorderStyle = useAnimatedStyle(() => {
    return {
      borderWidth: borderWidth.value,
    };
  });

  const handleFocus = (e: any) => {
    setIsFocused(true);
    borderWidth.value = withTiming(2, { duration: 200 });
    props.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    borderWidth.value = withTiming(1, { duration: 200 });
    props.onBlur?.(e);
  };

  const handleClear = () => {
    onChangeText?.('');
    onClear?.();
  };

  const showClear = showClearButton && value && value.length > 0 && isFocused;

  return (
    <View className="w-full">
      {label && (
        <Text className="text-white font-medium mb-2 text-sm">{label}</Text>
      )}

      <Animated.View
        className={`
          flex-row items-center bg-dark-100 rounded-lg px-4 py-3
          border
          ${variantStyles[variant].border}
          ${isFocused ? 'border-primary-500' : ''}
        `}
        style={animatedBorderStyle}
      >
        {prefixIcon && (
          <Ionicons
            name={prefixIcon}
            size={20}
            color="#71717a"
            style={{ marginRight: 8 }}
          />
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor="#71717a"
          className={`flex-1 ${variantStyles[variant].text}`}
          {...props}
        />

        {showClear && (
          <Pressable onPress={handleClear} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color="#71717a" />
          </Pressable>
        )}

        {suffixIcon && !showClear && (
          <Ionicons
            name={suffixIcon}
            size={20}
            color="#71717a"
            style={{ marginLeft: 8 }}
          />
        )}
      </Animated.View>

      {errorMessage && (
        <Text className="text-red-500 text-xs mt-1">{errorMessage}</Text>
      )}

      {successMessage && (
        <Text className="text-green-500 text-xs mt-1">{successMessage}</Text>
      )}
    </View>
  );
};

export default Input;
