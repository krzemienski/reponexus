import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  TextInputProps,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps extends Omit<TextInputProps, 'onChange'> {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  debounceMs?: number;
  showClearButton?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  onFocus,
  onBlur,
  debounceMs = 300,
  showClearButton = true,
  placeholder = 'Search...',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const debounceTimeout = useRef<NodeJS.Timeout>();
  const borderWidth = useSharedValue(1);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const animatedBorderStyle = useAnimatedStyle(() => {
    return {
      borderWidth: borderWidth.value,
    };
  });

  const handleFocus = () => {
    setIsFocused(true);
    borderWidth.value = withTiming(2, { duration: 200 });
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderWidth.value = withTiming(1, { duration: 200 });
    onBlur?.();
  };

  const handleChangeText = (text: string) => {
    setLocalValue(text);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      onChangeText(text);
    }, debounceMs);
  };

  const handleClear = () => {
    setLocalValue('');
    onChangeText('');
    onClear?.();

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return (
    <Animated.View
      className={`
        flex-row items-center bg-dark-100 rounded-lg px-4 py-3
        border border-dark-200
        ${isFocused ? 'border-primary-500' : ''}
      `}
      style={animatedBorderStyle}
    >
      <Ionicons
        name="search"
        size={20}
        color={isFocused ? '#0284c7' : '#71717a'}
        style={{ marginRight: 8 }}
      />

      <TextInput
        value={localValue}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor="#71717a"
        className="flex-1 text-white"
        {...props}
      />

      {showClearButton && localValue.length > 0 && (
        <Pressable onPress={handleClear} hitSlop={8}>
          <Ionicons name="close-circle" size={20} color="#71717a" />
        </Pressable>
      )}
    </Animated.View>
  );
};

export default SearchBar;
