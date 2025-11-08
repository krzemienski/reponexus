import React from 'react';
import { View } from 'react-native';
import { Surface, Text, Button, Icon } from 'react-native-paper';

interface SuggestionBannerProps {
  onDismiss?: () => void;
  onExplore?: () => void;
}

/**
 * SuggestionBanner Component
 *
 * Placeholder component for topic suggestions banner.
 * Will be implemented by Agent 2 to show personalized topic recommendations.
 */
export const SuggestionBanner: React.FC<SuggestionBannerProps> = ({
  onDismiss,
  onExplore,
}) => {
  return (
    <Surface
      style={{
        margin: 16,
        marginBottom: 8,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#1e293b',
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: '#0ea5e9',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}>
          <Text style={{ fontSize: 20 }}>✨</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#ffffff' }}>
            Discover New Topics
          </Text>
          <Text variant="bodySmall" style={{ color: '#94a3b8', marginTop: 2 }}>
            Personalized suggestions based on your interests
          </Text>
        </View>
        {onDismiss && (
          <Button
            mode="text"
            onPress={onDismiss}
            compact
            textColor="#94a3b8"
          >
            Dismiss
          </Button>
        )}
      </View>

      <Text variant="bodyMedium" style={{ color: '#cbd5e1', marginBottom: 12 }}>
        We'll suggest topics based on your activity and interests. Agent 2 will implement this feature soon!
      </Text>

      {onExplore && (
        <Button
          mode="contained"
          onPress={onExplore}
          icon="compass-outline"
          style={{ backgroundColor: '#0ea5e9' }}
        >
          Explore Topics
        </Button>
      )}
    </Surface>
  );
};

export default SuggestionBanner;
