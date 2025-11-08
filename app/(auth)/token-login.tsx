import { useState, useEffect } from 'react';
import { View, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Text, TextInput, Surface, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTokenAuth } from '@/hooks/useTokenAuth';

export default function TokenLoginScreen() {
  const [token, setToken] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const router = useRouter();

  const { loginWithToken, isLoading, error, clearError } = useTokenAuth();

  /**
   * Show error alert
   */
  useEffect(() => {
    if (error) {
      Alert.alert(
        'Token Login Error',
        error,
        [{ text: 'OK', onPress: () => clearError() }]
      );
    }
  }, [error, clearError]);

  /**
   * Handle token login
   */
  const handleLogin = async () => {
    try {
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Validate token
      if (!token.trim()) {
        Alert.alert('Validation Error', 'Please enter a GitHub token');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      // Attempt login
      const success = await loginWithToken(token.trim());

      if (success) {
        // Success haptic
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Navigate to main app
        router.replace('/(tabs)/explore');
      } else {
        // Error haptic
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error('Token login failed:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  /**
   * Go back to OAuth login
   */
  const handleBackToOAuth = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  /**
   * Toggle token visibility
   */
  const toggleSecureEntry = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSecureTextEntry(!secureTextEntry);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <Surface style={{ flex: 1, padding: 24 }}>
          {/* Header */}
          <View style={{ marginTop: 60, marginBottom: 40 }}>
            <Text variant="headlineLarge" style={{ fontWeight: 'bold', marginBottom: 8 }}>
              Developer Login
            </Text>
            <Text variant="bodyLarge" style={{ opacity: 0.7 }}>
              Login with a GitHub Personal Access Token for testing
            </Text>
          </View>

          {/* Instructions */}
          <Surface
            style={{
              padding: 16,
              backgroundColor: 'rgba(14, 165, 233, 0.1)',
              borderRadius: 12,
              marginBottom: 24,
            }}
          >
            <Text variant="titleSmall" style={{ marginBottom: 8, fontWeight: 'bold' }}>
              How to get a GitHub token:
            </Text>
            <Text variant="bodyMedium" style={{ opacity: 0.8 }}>
              1. Go to GitHub Settings{'\n'}
              2. Developer settings → Personal access tokens → Tokens (classic){'\n'}
              3. Generate new token (classic){'\n'}
              4. Select scopes: <Text style={{ fontWeight: 'bold' }}>user, repo, read:org</Text>{'\n'}
              5. Copy and paste the token below
            </Text>
          </Surface>

          {/* Token Input */}
          <View style={{ marginBottom: 24 }}>
            <TextInput
              label="GitHub Personal Access Token"
              value={token}
              onChangeText={setToken}
              secureTextEntry={secureTextEntry}
              mode="outlined"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              autoCapitalize="none"
              autoCorrect={false}
              disabled={isLoading}
              right={
                <TextInput.Icon
                  icon={secureTextEntry ? 'eye-off' : 'eye'}
                  onPress={toggleSecureEntry}
                />
              }
              style={{ marginBottom: 8 }}
            />
            <Text variant="bodySmall" style={{ opacity: 0.6 }}>
              Your token is used only for testing and never stored on our servers
            </Text>
          </View>

          {/* Login Button */}
          <Button
            mode="contained"
            onPress={handleLogin}
            disabled={isLoading || !token.trim()}
            loading={isLoading}
            icon="key"
            style={{ marginBottom: 16, paddingVertical: 8 }}
            contentStyle={{ paddingVertical: 4 }}
          >
            Login with Token
          </Button>

          {/* Back to OAuth */}
          <Button
            mode="outlined"
            onPress={handleBackToOAuth}
            disabled={isLoading}
            icon="arrow-left"
            style={{ paddingVertical: 8 }}
            contentStyle={{ paddingVertical: 4 }}
          >
            Use OAuth Instead
          </Button>

          {/* Warning */}
          <Surface
            style={{
              marginTop: 32,
              padding: 16,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 12,
            }}
          >
            <Text variant="bodySmall" style={{ color: '#ef4444', textAlign: 'center' }}>
              Development only - Do not use in production
            </Text>
          </Surface>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
