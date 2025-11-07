import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function CallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // TODO: Handle OAuth callback
        const { code } = params;

        if (code) {
          // Exchange code for token
          // Save token to secure storage
          // Navigate to main app
          router.replace('/(tabs)/explore');
        } else {
          // Error handling
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error('Callback error:', error);
        router.replace('/(auth)/login');
      }
    };

    handleCallback();
  }, [params, router]);

  return (
    <View className="flex-1 bg-dark-50 items-center justify-center">
      <ActivityIndicator size="large" color="#0ea5e9" />
      <Text className="text-white text-lg mt-4">Authenticating...</Text>
    </View>
  );
}
