import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
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
    <View className="flex-1 bg-dark-50 items-center justify-center px-6">
      {/* App Branding */}
      <View className="items-center mb-12">
        <Text className="text-4xl font-bold text-white mb-2">Repo Nexus</Text>
        <Text className="text-lg text-dark-500 text-center">
          Discover and explore GitHub repositories
        </Text>
      </View>

      {/* Login Buttons */}
      <View className="w-full max-w-sm">
        {/* GitHub OAuth Login */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoading}
          className="bg-primary-600 px-8 py-4 rounded-lg w-full mb-4"
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              Sign in with GitHub
            </Text>
          )}
        </TouchableOpacity>

        {/* Biometric Login (if available) */}
        {showBiometric && !isLoading && (
          <TouchableOpacity
            onPress={handleBiometricLogin}
            className="bg-dark-200 px-8 py-4 rounded-lg w-full border border-dark-300"
            activeOpacity={0.8}
          >
            <Text className="text-white text-center font-semibold text-lg">
              Use Biometric
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Terms of Service */}
      <Text className="text-dark-500 text-sm mt-8 text-center">
        By signing in, you agree to our{' '}
        <Text className="text-primary-500">Terms of Service</Text>
      </Text>

      {/* Error Message */}
      {error && !isLoading && (
        <View className="mt-4 px-4 py-3 bg-red-900/20 border border-red-700 rounded-lg max-w-sm w-full">
          <Text className="text-red-400 text-center text-sm">{error}</Text>
        </View>
      )}
    </View>
  );
}
