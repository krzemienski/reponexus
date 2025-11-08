import { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import { Button, Text, ActivityIndicator, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const [showBiometric, setShowBiometric] = useState(false);
  const router = useRouter();

  const {
    login,
    loginWithBiometric,
    isLoading,
    error,
    isAuthenticated,
    isBiometricAvailable,
    isBiometricEnabled,
  } = useAuth();

  /**
   * Check if biometric authentication is available and enabled
   */
  useEffect(() => {
    const checkBiometric = async () => {
      const available = await isBiometricAvailable();
      const enabled = await isBiometricEnabled();

      setShowBiometric(available && enabled);
    };

    checkBiometric();
  }, [isBiometricAvailable, isBiometricEnabled]);

  /**
   * Redirect if already authenticated
   */
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)/explore');
    }
  }, [isAuthenticated, router]);

  /**
   * Show error alert
   */
  useEffect(() => {
    if (error) {
      Alert.alert(
        'Authentication Error',
        error,
        [{ text: 'OK', onPress: () => {} }]
      );
    }
  }, [error]);

  /**
   * Handle GitHub OAuth login
   */
  const handleLogin = async () => {
    try {
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Initiate login
      const success = await login();

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
      console.error('Login failed:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  /**
   * Handle biometric login
   */
  const handleBiometricLogin = async () => {
    try {
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Attempt biometric login
      const success = await loginWithBiometric();

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
      console.error('Biometric login failed:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <Surface style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      {/* App Branding */}
      <View style={{ alignItems: 'center', marginBottom: 48 }}>
        <Text variant="displayLarge" style={{ fontWeight: 'bold', marginBottom: 8 }}>
          Repo Nexus
        </Text>
        <Text variant="titleMedium" style={{ textAlign: 'center', opacity: 0.7 }}>
          Discover and explore GitHub repositories
        </Text>
      </View>

      {/* Login Buttons */}
      <View style={{ width: '100%', maxWidth: 400 }}>
        {/* GitHub OAuth Login */}
        <Button
          mode="contained"
          onPress={handleLogin}
          disabled={isLoading}
          loading={isLoading}
          icon="github"
          style={{ marginBottom: 16, paddingVertical: 8 }}
          contentStyle={{ paddingVertical: 4 }}
        >
          Sign in with GitHub
        </Button>

        {/* Biometric Login (if available) */}
        {showBiometric && !isLoading && (
          <Button
            mode="outlined"
            onPress={handleBiometricLogin}
            icon="fingerprint"
            style={{ marginBottom: 16, paddingVertical: 8 }}
            contentStyle={{ paddingVertical: 4 }}
          >
            Use Biometric
          </Button>
        )}

        {/* Token Login (dev only) */}
        {__DEV__ && !isLoading && (
          <Button
            mode="text"
            onPress={() => router.push('/(auth)/token-login')}
            icon="key"
            style={{ paddingVertical: 8 }}
            contentStyle={{ paddingVertical: 4 }}
          >
            Test with Token (Dev)
          </Button>
        )}
      </View>

      {/* Terms of Service */}
      <Text variant="bodySmall" style={{ marginTop: 32, textAlign: 'center', opacity: 0.6 }}>
        By signing in, you agree to our{' '}
        <Text variant="bodySmall" style={{ color: '#0ea5e9' }}>Terms of Service</Text>
      </Text>

      {/* Error Message */}
      {error && !isLoading && (
        <Surface
          style={{
            marginTop: 16,
            padding: 16,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 8,
            maxWidth: 400,
            width: '100%',
          }}
        >
          <Text variant="bodyMedium" style={{ color: '#f87171', textAlign: 'center' }}>
            {error}
          </Text>
        </Surface>
      )}
    </Surface>
  );
}
