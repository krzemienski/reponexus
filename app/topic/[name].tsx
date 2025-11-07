import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function TopicDetailScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams();

  return (
    <SafeAreaView className="flex-1 bg-dark-50">
      <View className="px-4 py-4">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-primary-500 text-lg">← Back</Text>
        </TouchableOpacity>

        <ScrollView>
          <Text className="text-3xl font-bold text-white mb-2">{name}</Text>
          <Text className="text-dark-500 mb-4">Topic description</Text>

          <TouchableOpacity className="bg-primary-600 px-6 py-3 rounded-lg mb-6">
            <Text className="text-white text-center font-semibold">Follow Topic</Text>
          </TouchableOpacity>

          <View className="bg-dark-100 rounded-lg p-4">
            <Text className="text-white text-lg font-semibold mb-2">
              Repositories
            </Text>
            <Text className="text-dark-500">
              Loading repositories for this topic...
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
