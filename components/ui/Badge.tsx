import React from 'react';
import { View, Text, ViewStyle } from 'react-native';

type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  style?: ViewStyle;
}

const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
  default: {
    container: 'bg-dark-200',
    text: 'text-white',
  },
  success: {
    container: 'bg-green-500/20',
    text: 'text-green-500',
  },
  error: {
    container: 'bg-red-500/20',
    text: 'text-red-500',
  },
  warning: {
    container: 'bg-yellow-500/20',
    text: 'text-yellow-500',
  },
  info: {
    container: 'bg-primary-500/20',
    text: 'text-primary-500',
  },
};

const sizeStyles: Record<BadgeSize, { container: string; text: string }> = {
  sm: {
    container: 'px-2 py-0.5 rounded-md',
    text: 'text-xs',
  },
  md: {
    container: 'px-2.5 py-1 rounded-md',
    text: 'text-sm',
  },
  lg: {
    container: 'px-3 py-1.5 rounded-lg',
    text: 'text-base',
  },
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  children,
  style,
}) => {
  return (
    <View
      className={`
        ${variantStyles[variant].container}
        ${sizeStyles[size].container}
      `}
      style={style}
    >
      <Text
        className={`
          font-medium
          ${variantStyles[variant].text}
          ${sizeStyles[size].text}
        `}
      >
        {children}
      </Text>
    </View>
  );
};

export default Badge;
