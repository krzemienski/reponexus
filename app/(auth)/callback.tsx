import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text, ActivityIndicator, Surface } from 'react-native-paper';
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
    <Surface style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      {/* Loading Indicator */}
      <ActivityIndicator size="large" />

      {/* Status Message */}
      <Text variant="titleMedium" style={{ marginTop: 16, textAlign: 'center' }}>
        {statusMessage}
      </Text>

      {/* Additional info for errors */}
      {statusMessage.toLowerCase().includes('error') ||
       statusMessage.toLowerCase().includes('failed') ? (
        <Text variant="bodySmall" style={{ marginTop: 8, textAlign: 'center', opacity: 0.6 }}>
          Redirecting to login...
        </Text>
      ) : null}
    </Surface>
  );
}
