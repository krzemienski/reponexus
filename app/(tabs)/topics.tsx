import React, { useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text, Searchbar, Button, Surface, Portal, Modal } from 'react-native-paper';
import { TopicList } from '@/components/features/topic/TopicList';
import { useUserTopics, useFollowTopic, useUnfollowTopic } from '@/hooks/queries';

export default function TopicsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [addTopicVisible, setAddTopicVisible] = useState(false);

  // Fetch user's followed topics from API
  const { data, isLoading, isError, refetch, isFetching } = useUserTopics();

  // Mutation hooks for follow/unfollow
  const followMutation = useFollowTopic();
  const unfollowMutation = useUnfollowTopic();

  const topics = data || [];
  const isRefreshing = isFetching;

  const handleSearch = () => {
    if (searchQuery.trim()) {
      console.log('Searching topics:', searchQuery);
    }
  };

  const handleRefresh = async () => {
    await refetch();
  };

  const handleFollow = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    if (topic) {
      followMutation.mutate({ topicName: topic.name });
    }
  };

  const handleUnfollow = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    if (topic) {
      unfollowMutation.mutate({ topicName: topic.name });
    }
  };

  const handleDelete = (topicId: string) => {
    // Delete means unfollow in this context
    const topic = topics.find(t => t.id === topicId);
    if (topic) {
      unfollowMutation.mutate({ topicName: topic.name });
    }
  };

  const handleExploreTopics = () => {
    router.push('/(tabs)/explore');
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Surface style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ padding: 16, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>
              Topics
            </Text>
            <Button
              mode="contained"
              onPress={() => setAddTopicVisible(true)}
              compact
            >
              Add Topic
            </Button>
          </View>

          {/* Search Bar */}
          <Searchbar
            placeholder="Search topics..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>

        {/* Topics List */}
        <View style={{ flex: 1, paddingTop: 8 }}>
          <ScrollView
            style={{ flex: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
              />
            }
          >
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
          </ScrollView>
        </View>

        {/* Add Topic Modal */}
        <Portal>
          <Modal
            visible={addTopicVisible}
            onDismiss={() => setAddTopicVisible(false)}
            contentContainerStyle={{
              backgroundColor: 'white',
              margin: 20,
              padding: 24,
              borderRadius: 8,
            }}
          >
            <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 16 }}>
              Add Topic
            </Text>
            <Searchbar
              placeholder="Search for topics to follow..."
              value=""
              onChangeText={() => {}}
            />
            <View style={{ height: 256, alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
              <Text style={{ opacity: 0.6 }}>Search functionality coming soon</Text>
            </View>
            <Button
              mode="outlined"
              onPress={() => setAddTopicVisible(false)}
              style={{ marginTop: 16 }}
            >
              Close
            </Button>
          </Modal>
        </Portal>
      </Surface>
    </SafeAreaView>
  );
}
