import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/hooks/useAuth';

export default function CallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [statusMessage, setStatusMessage] = useState('Authenticating...');
  const { handleCallback } = useAuth();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Parse OAuth callback parameters
        const { code, error, error_description, state } = params;

        // Check for OAuth errors
        if (error) {
          console.error('[Callback] OAuth error:', error, error_description);

          // Provide user-friendly error messages
          let errorMessage = 'Authentication failed';

          if (error === 'access_denied') {
            errorMessage = 'Authentication cancelled. You must grant access to continue.';
          } else if (error_description) {
            errorMessage = error_description as string;
          }

          setStatusMessage(errorMessage);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

          // Redirect to login after delay
          setTimeout(() => {
            router.replace('/(auth)/login');
          }, 2000);
          return;
        }

        // Check if code is present
        if (!code) {
          console.error('[Callback] No authorization code received');
          setStatusMessage('Invalid authentication response');
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

          setTimeout(() => {
            router.replace('/(auth)/login');
          }, 2000);
          return;
        }

        // Create AuthSession result object
        const result: AuthSession.AuthSessionResult = {
          type: 'success',
          params: {
            code: code as string,
            state: state as string,
          },
          authentication: null,
          url: '',
          errorCode: null,
        };

        // Update status
        setStatusMessage('Verifying credentials...');

        // Handle callback through auth hook
        const success = await handleCallback(result);

        if (success) {
          // Success - navigate to main app
          setStatusMessage('Success! Redirecting...');
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          setTimeout(() => {
            router.replace('/(tabs)/explore');
          }, 500);
        } else {
          // Failed to exchange code for token
          setStatusMessage('Authentication failed. Please try again.');
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

          setTimeout(() => {
            router.replace('/(auth)/login');
          }, 2000);
        }
      } catch (error: any) {
        console.error('[Callback] Error processing callback:', error);

        // Determine error message
        let errorMessage = 'An unexpected error occurred';

        if (error?.message?.includes('cancel')) {
          errorMessage = 'Authentication was cancelled';
        } else if (error?.message?.includes('network')) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error?.message) {
          errorMessage = error.message;
        }

        setStatusMessage(errorMessage);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        // Redirect to login after delay
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 2000);
      }
    };

    processCallback();
  }, [params, router, handleCallback]);

  return (
    <View className="flex-1 bg-dark-50 items-center justify-center px-6">
      {/* Loading Indicator */}
      <ActivityIndicator size="large" color="#0ea5e9" />

      {/* Status Message */}
      <Text className="text-white text-lg mt-4 text-center">
        {statusMessage}
      </Text>

      {/* Additional info for errors */}
      {statusMessage.toLowerCase().includes('error') ||
       statusMessage.toLowerCase().includes('failed') ? (
        <Text className="text-dark-500 text-sm mt-2 text-center">
          Redirecting to login...
        </Text>
      ) : null}
    </View>
  );
}
