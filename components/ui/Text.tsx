import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

type TextVariant = 'heading' | 'title' | 'body' | 'caption' | 'label';
type TextColor =
  | 'primary'
  | 'secondary'
  | 'white'
  | 'gray'
  | 'success'
  | 'error'
  | 'warning';
type FontWeight = 'normal' | 'medium' | 'semibold' | 'bold';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
  weight?: FontWeight;
  children: React.ReactNode;
}

const variantStyles: Record<TextVariant, string> = {
  heading: 'text-3xl',
  title: 'text-xl',
  body: 'text-base',
  caption: 'text-sm',
  label: 'text-xs',
};

const colorStyles: Record<TextColor, string> = {
  primary: 'text-primary-500',
  secondary: 'text-secondary-500',
  white: 'text-white',
  gray: 'text-dark-400',
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
};

const weightStyles: Record<FontWeight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'white',
  weight = 'normal',
  children,
  className,
  ...props
}) => {
  return (
    <RNText
      className={`
        ${variantStyles[variant]}
        ${colorStyles[color]}
        ${weightStyles[weight]}
        ${className || ''}
      `}
      {...props}
    >
      {children}
    </RNText>
  );
};

export default Text;
