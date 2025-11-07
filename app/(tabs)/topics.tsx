import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TopicList } from '@/components/features/topic/TopicList';

export default function TopicsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [addTopicVisible, setAddTopicVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data - in production, this would come from React Query
  const topics = [];
  const isLoading = false;
  const isError = false;

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Navigate to search results or filter topics
      console.log('Searching topics:', searchQuery);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleFollow = (topicId: string) => {
    console.log('Follow topic:', topicId);
    // Implement follow logic
  };

  const handleUnfollow = (topicId: string) => {
    console.log('Unfollow topic:', topicId);
    // Implement unfollow logic
  };

  const handleDelete = (topicId: string) => {
    console.log('Delete topic:', topicId);
    // Implement delete logic
  };

  const handleExploreTopics = () => {
    router.push('/explore');
  };

  return (
    <SafeAreaView className="flex-1 bg-dark-50">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-4">
            <Text variant="heading" weight="bold">
              Topics
            </Text>
            <Button
              variant="primary"
              size="sm"
              onPress={() => setAddTopicVisible(true)}
            >
              Add Topic
            </Button>
          </View>

          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search topics..."
            onSubmitEditing={handleSearch}
          />
        </View>

        {/* Topics List */}
        <View className="flex-1 pt-2">
          <TopicList
            topics={topics}
            isLoading={isLoading}
            isError={isError}
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
            onFollow={handleFollow}
            onUnfollow={handleUnfollow}
            onDelete={handleDelete}
            showFollowButton={true}
            allowSwipeDelete={true}
            emptyTitle="No topics followed yet"
            emptyMessage="Start following topics to stay updated with your interests."
            emptyActionLabel="Explore Topics"
            onEmptyAction={handleExploreTopics}
          />
        </View>

        {/* Add Topic Modal */}
        <Modal visible={addTopicVisible} onClose={() => setAddTopicVisible(false)}>
          <View className="px-6 py-4">
            <Text variant="title" weight="bold" className="mb-4">
              Add Topic
            </Text>
            <SearchBar
              value=""
              onChangeText={() => {}}
              placeholder="Search for topics to follow..."
            />
            <View className="h-64 items-center justify-center">
              <Text color="gray">Search functionality coming soon</Text>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
