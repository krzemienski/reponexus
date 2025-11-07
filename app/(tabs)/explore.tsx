import { View, Text, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExploreScreen() {
  return (
    <SafeAreaView className="flex-1 bg-dark-50">
      <View className="px-4 py-4">
        <Text className="text-3xl font-bold text-white mb-4">Explore</Text>

        <TextInput
          placeholder="Search repositories, topics..."
          placeholderTextColor="#71717a"
          className="bg-dark-100 text-white px-4 py-3 rounded-lg mb-4"
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-2">
            {['React', 'TypeScript', 'Python', 'Go', 'Rust'].map((topic) => (
              <View key={topic} className="bg-primary-600/20 px-4 py-2 rounded-full">
                <Text className="text-primary-400 font-medium">{topic}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View className="bg-dark-100 rounded-lg p-4">
          <Text className="text-white text-lg font-semibold mb-2">
            Featured Repositories
          </Text>
          <Text className="text-dark-500">
            Loading repositories...
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
