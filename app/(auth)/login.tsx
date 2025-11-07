import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      // TODO: Implement OAuth login
      // For now, just navigate to tabs
      router.replace('/(tabs)/explore');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-dark-50 items-center justify-center px-6">
      <View className="items-center mb-12">
        <Text className="text-4xl font-bold text-white mb-2">Repo Nexus</Text>
        <Text className="text-lg text-dark-500 text-center">
          Discover and explore GitHub repositories
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        className="bg-primary-600 px-8 py-4 rounded-lg w-full max-w-sm"
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">
            Sign in with GitHub
          </Text>
        )}
      </TouchableOpacity>

      <Text className="text-dark-500 text-sm mt-8 text-center">
        By signing in, you agree to our{' '}
        <Text className="text-primary-500">Terms of Service</Text>
      </Text>
    </View>
  );
}
