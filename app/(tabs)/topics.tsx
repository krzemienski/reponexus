import React, { useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text, Searchbar, Button, Surface, Portal, Modal } from 'react-native-paper';
import { TopicList } from '@/components/features/topic/TopicList';

// Mock topics data for testing
const MOCK_TOPICS = [
  {
    id: '1',
    name: 'react',
    displayName: 'React',
    description: 'A JavaScript library for building user interfaces',
    repositoryCount: 234567,
    isFollowed: true,
    createdAt: new Date('2013-05-24').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'typescript',
    displayName: 'TypeScript',
    description: 'TypeScript is a superset of JavaScript that compiles to JavaScript',
    repositoryCount: 198765,
    isFollowed: true,
    createdAt: new Date('2014-06-17').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'python',
    displayName: 'Python',
    description: 'A high-level, interpreted programming language',
    repositoryCount: 456789,
    isFollowed: true,
    createdAt: new Date('2008-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'machine-learning',
    displayName: 'Machine Learning',
    description: 'Artificial intelligence and machine learning repositories',
    repositoryCount: 123456,
    isFollowed: false,
    createdAt: new Date('2010-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'web-development',
    displayName: 'Web Development',
    description: 'Web development tools, frameworks, and resources',
    repositoryCount: 345678,
    isFollowed: true,
    createdAt: new Date('2005-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function TopicsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [addTopicVisible, setAddTopicVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [topics, setTopics] = useState(MOCK_TOPICS);

  const isLoading = false;
  const isError = false;

  const handleSearch = () => {
    if (searchQuery.trim()) {
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
    setTopics(topics.map(topic =>
      topic.id === topicId ? { ...topic, isFollowed: true } : topic
    ));
  };

  const handleUnfollow = (topicId: string) => {
    console.log('Unfollow topic:', topicId);
    setTopics(topics.map(topic =>
      topic.id === topicId ? { ...topic, isFollowed: false } : topic
    ));
  };

  const handleDelete = (topicId: string) => {
    console.log('Delete topic:', topicId);
    setTopics(topics.filter(topic => topic.id !== topicId));
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
