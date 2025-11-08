import React from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { useSuggestions, useAcceptSuggestion, useDismissSuggestion } from '@/hooks/queries/useSuggestions';
import { router } from 'expo-router';

export default function SuggestionsScreen() {
  const { data, isLoading, error, refetch, isRefetching } = useSuggestions(false);
  const acceptMutation = useAcceptSuggestion();
  const dismissMutation = useDismissSuggestion();

  const handleAccept = (suggestionId: string, topicName: string) => {
    Alert.alert(
      'Follow Topic',
      `Start following ${topicName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Follow',
          onPress: () => {
            acceptMutation.mutate(suggestionId, {
              onSuccess: () => {
                Alert.alert('Success', `Now following ${topicName}`);
              },
              onError: (error) => {
                Alert.alert('Error', error.message || 'Failed to follow topic');
              },
            });
          },
        },
      ]
    );
  };

  const handleDismiss = (suggestionId: string) => {
    dismissMutation.mutate(suggestionId, {
      onError: (error) => {
        Alert.alert('Error', error.message || 'Failed to dismiss suggestion');
      },
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center p-4">
        <Text className="text-white text-lg">Loading suggestions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center p-4">
        <Text className="text-red-500 text-lg mb-4">Failed to load suggestions</Text>
        <Text className="text-zinc-400 text-center">{error.message}</Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="mt-4 bg-sky-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const suggestions = data?.suggestions || [];

  if (suggestions.length === 0) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center p-4">
        <Text className="text-white text-xl font-bold mb-2">No Suggestions</Text>
        <Text className="text-zinc-400 text-center mb-4">
          Sync your starred repos to get personalized topic suggestions
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile')}
          className="bg-sky-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Go to Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-zinc-950">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0ea5e9" />
        }
      >
        <View className="p-4">
          <Text className="text-white text-2xl font-bold mb-2">Topic Suggestions</Text>
          <Text className="text-zinc-400 mb-6">
            Based on your {data?.total || 0} starred repositories
          </Text>

          {suggestions.map((suggestion) => (
            <View
              key={suggestion.id}
              className="bg-zinc-900 rounded-xl p-4 mb-4 border border-zinc-800"
            >
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                  <Text className="text-white text-lg font-bold mb-1">
                    {suggestion.topicDisplayName}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <View className="bg-sky-500/20 px-2 py-1 rounded">
                      <Text className="text-sky-400 text-xs font-semibold">
                        {suggestion.relevanceScore}% match
                      </Text>
                    </View>
                    <Text className="text-zinc-500 text-sm">
                      {suggestion.starredRepoCount} repos
                    </Text>
                  </View>
                </View>
              </View>

              {suggestion.reason && (
                <Text className="text-zinc-400 text-sm mb-3">{suggestion.reason}</Text>
              )}

              {suggestion.exampleRepos && suggestion.exampleRepos.length > 0 && (
                <View className="mb-3">
                  <Text className="text-zinc-500 text-xs font-semibold mb-2 uppercase">
                    Example Repositories
                  </Text>
                  {suggestion.exampleRepos.map((repo, idx) => (
                    <View key={idx} className="bg-zinc-800/50 rounded-lg p-2 mb-1">
                      <Text className="text-white text-sm font-medium">
                        {repo.nameWithOwner}
                      </Text>
                      {repo.description && (
                        <Text className="text-zinc-500 text-xs mt-1" numberOfLines={1}>
                          {repo.description}
                        </Text>
                      )}
                      <View className="flex-row items-center gap-2 mt-1">
                        {repo.primaryLanguage && (
                          <Text className="text-zinc-400 text-xs">{repo.primaryLanguage}</Text>
                        )}
                        <Text className="text-zinc-500 text-xs">
                          ⭐ {repo.stargazerCount.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => handleAccept(suggestion.id, suggestion.topicDisplayName)}
                  disabled={acceptMutation.isPending}
                  className="flex-1 bg-sky-500 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white text-center font-semibold">
                    {acceptMutation.isPending ? 'Following...' : 'Follow'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDismiss(suggestion.id)}
                  disabled={dismissMutation.isPending}
                  className="px-4 py-2 rounded-lg border border-zinc-700"
                >
                  <Text className="text-zinc-400 text-center font-semibold">Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
