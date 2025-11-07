import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();

  const handleSignOut = () => {
    // TODO: Implement sign out
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-dark-50">
      <View className="px-4 py-4">
        <Text className="text-3xl font-bold text-white mb-6">Profile</Text>

        <View className="items-center mb-6">
          <View className="w-24 h-24 bg-primary-600 rounded-full mb-4" />
          <Text className="text-white text-xl font-semibold">Username</Text>
          <Text className="text-dark-500">@username</Text>
        </View>

        <View className="bg-dark-100 rounded-lg p-4 mb-4">
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-white text-2xl font-bold">0</Text>
              <Text className="text-dark-500">Repositories</Text>
            </View>
            <View className="items-center">
              <Text className="text-white text-2xl font-bold">0</Text>
              <Text className="text-dark-500">Followers</Text>
            </View>
            <View className="items-center">
              <Text className="text-white text-2xl font-bold">0</Text>
              <Text className="text-dark-500">Following</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-red-600/20 border border-red-600 px-6 py-3 rounded-lg"
        >
          <Text className="text-red-500 text-center font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
