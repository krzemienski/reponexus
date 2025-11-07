import { View, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TopicsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-dark-50">
      <View className="px-4 py-4">
        <Text className="text-3xl font-bold text-white mb-4">Topics</Text>

        <TextInput
          placeholder="Search topics..."
          placeholderTextColor="#71717a"
          className="bg-dark-100 text-white px-4 py-3 rounded-lg mb-4"
        />

        <View className="bg-dark-100 rounded-lg p-4">
          <Text className="text-white text-lg font-semibold mb-2">
            Followed Topics
          </Text>
          <Text className="text-dark-500">
            No topics followed yet
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
