import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

// Custom color palette matching the app's design
const customColors = {
  primary: {
    main: '#0ea5e9', // sky-500
    dark: '#0284c7', // sky-600
    light: '#38bdf8', // sky-400
  },
  secondary: {
    main: '#8b5cf6', // violet-500
    dark: '#7c3aed', // violet-600
    light: '#a78bfa', // violet-400
  },
  background: {
    dark: '#09090b', // zinc-950
    darkElevated: '#18181b', // zinc-900
    light: '#ffffff',
    lightElevated: '#f4f4f5', // zinc-100
  },
  surface: {
    dark: '#27272a', // zinc-800
    darkElevated: '#3f3f46', // zinc-700
    light: '#ffffff',
    lightElevated: '#f4f4f5',
  },
  text: {
    dark: '#ffffff',
    darkSecondary: '#a1a1aa', // zinc-400
    light: '#18181b', // zinc-900
    lightSecondary: '#71717a', // zinc-500
  },
  border: {
    dark: '#3f3f46', // zinc-700
    light: '#e4e4e7', // zinc-200
  },
  error: '#ef4444', // red-500
  success: '#22c55e', // green-500
  warning: '#f59e0b', // amber-500
};

// Dark theme configuration
export const paperDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: customColors.primary.main,
    primaryContainer: customColors.primary.dark,
    secondary: customColors.secondary.main,
    secondaryContainer: customColors.secondary.dark,
    background: customColors.background.dark,
    surface: customColors.surface.dark,
    surfaceVariant: customColors.surface.darkElevated,
    error: customColors.error,
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onBackground: customColors.text.dark,
    onSurface: customColors.text.dark,
    outline: customColors.border.dark,
  },
  dark: true,
};

// Light theme configuration
export const paperLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: customColors.primary.main,
    primaryContainer: customColors.primary.light,
    secondary: customColors.secondary.main,
    secondaryContainer: customColors.secondary.light,
    background: customColors.background.light,
    surface: customColors.surface.light,
    surfaceVariant: customColors.surface.lightElevated,
    error: customColors.error,
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onBackground: customColors.text.light,
    onSurface: customColors.text.light,
    outline: customColors.border.light,
  },
  dark: false,
};
