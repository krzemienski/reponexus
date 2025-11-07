import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TrendingScreen() {
  return (
    <SafeAreaView className="flex-1 bg-dark-50">
      <View className="px-4 py-4">
        <Text className="text-3xl font-bold text-white mb-4">Trending</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-2">
            {['Today', 'This Week', 'This Month'].map((period, index) => (
              <View
                key={period}
                className={`px-6 py-2 rounded-full ${
                  index === 0 ? 'bg-primary-600' : 'bg-dark-100'
                }`}
              >
                <Text
                  className={`font-medium ${
                    index === 0 ? 'text-white' : 'text-dark-500'
                  }`}
                >
                  {period}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View className="bg-dark-100 rounded-lg p-4">
          <Text className="text-white text-lg font-semibold mb-2">
            Trending Repositories
          </Text>
          <Text className="text-dark-500">
            Loading trending data...
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
