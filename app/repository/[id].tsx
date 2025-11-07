import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function RepositoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  return (
    <SafeAreaView className="flex-1 bg-dark-50">
      <View className="px-4 py-4">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-primary-500 text-lg">← Back</Text>
        </TouchableOpacity>

        <ScrollView>
          <Text className="text-2xl font-bold text-white mb-2">Repository {id}</Text>
          <Text className="text-dark-500 mb-4">Owner/repo-name</Text>

          <View className="bg-dark-100 rounded-lg p-4 mb-4">
            <Text className="text-white mb-2">
              Repository description goes here...
            </Text>
          </View>

          <View className="flex-row gap-4 mb-4">
            <View className="bg-dark-100 px-4 py-2 rounded-lg flex-1">
              <Text className="text-dark-500 text-sm">Stars</Text>
              <Text className="text-white text-lg font-semibold">0</Text>
            </View>
            <View className="bg-dark-100 px-4 py-2 rounded-lg flex-1">
              <Text className="text-dark-500 text-sm">Forks</Text>
              <Text className="text-white text-lg font-semibold">0</Text>
            </View>
            <View className="bg-dark-100 px-4 py-2 rounded-lg flex-1">
              <Text className="text-dark-500 text-sm">Issues</Text>
              <Text className="text-white text-lg font-semibold">0</Text>
            </View>
          </View>

          <TouchableOpacity className="bg-primary-600 px-6 py-3 rounded-lg">
            <Text className="text-white text-center font-semibold">Star</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
