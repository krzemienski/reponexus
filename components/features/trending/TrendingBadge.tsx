/**
 * TrendingBadge Component
 * Displays trending score as a fire icon with color-coded number
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getTrendingScoreColor, formatTrendingScore } from '@/hooks/queries';

interface TrendingBadgeProps {
  score: number | undefined;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

/**
 * TrendingBadge - Shows trending score with fire icon
 *
 * Color coding:
 * - 80-100: Red (very hot)
 * - 60-79: Orange (hot)
 * - 40-59: Yellow (warm)
 * - 0-39: Gray (cool)
 */
export function TrendingBadge({ score, size = 'medium', showLabel = true }: TrendingBadgeProps) {
  const theme = useTheme();

  if (!score || score === 0) {
    return null;
  }

  // Get color based on score
  const colorName = getTrendingScoreColor(score);

  // Map color names to actual colors
  const colors = {
    red: '#EF4444', // Red 500
    orange: '#F97316', // Orange 500
    yellow: '#EAB308', // Yellow 500
    gray: theme.colors.onSurfaceVariant,
  };

  const color = colors[colorName as keyof typeof colors] || colors.gray;

  // Size configurations
  const sizeConfig = {
    small: {
      iconSize: 14,
      textSize: 11,
      padding: 4,
    },
    medium: {
      iconSize: 18,
      textSize: 13,
      padding: 6,
    },
    large: {
      iconSize: 22,
      textSize: 15,
      padding: 8,
    },
  };

  const config = sizeConfig[size];

  return (
    <View style={[styles.container, { padding: config.padding }]}>
      <MaterialCommunityIcons name="fire" size={config.iconSize} color={color} />
      <Text
        variant="labelSmall"
        style={[
          styles.scoreText,
          {
            color,
            fontSize: config.textSize,
            fontWeight: '600',
          },
        ]}
      >
        {formatTrendingScore(score)}
      </Text>
      {showLabel && size !== 'small' && (
        <Text
          variant="labelSmall"
          style={[
            styles.labelText,
            {
              fontSize: config.textSize - 2,
              color: theme.colors.onSurfaceVariant,
            },
          ]}
        >
          Trending
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  scoreText: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  labelText: {
    opacity: 0.7,
    marginLeft: 2,
  },
});

/**
 * TrendingScorePill - Alternative compact display
 */
export function TrendingScorePill({ score }: { score: number | undefined }) {
  const theme = useTheme();

  if (!score || score === 0) {
    return null;
  }

  const colorName = getTrendingScoreColor(score);

  const colors = {
    red: '#EF4444',
    orange: '#F97316',
    yellow: '#EAB308',
    gray: theme.colors.onSurfaceVariant,
  };

  const color = colors[colorName as keyof typeof colors] || colors.gray;

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: `${color}15`, // 15% opacity
          borderColor: `${color}40`, // 40% opacity
        },
      ]}
    >
      <MaterialCommunityIcons name="trending-up" size={12} color={color} />
      <Text
        variant="labelSmall"
        style={[
          styles.pillText,
          {
            color,
          },
        ]}
      >
        {formatTrendingScore(score)}
      </Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

const styles = { ...styles, ...pillStyles };
