import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { RepositoryList } from '../repository/RepositoryList';
import { TopicList } from '../topic/TopicList';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import type { Repository, Topic, SearchType, SortOption } from '@/types/models';

interface SearchResultsProps {
  type: SearchType;
  repositories?: Repository[];
  topics?: Topic[];
  isLoading?: boolean;
  isError?: boolean;
  onTypeChange?: (type: SearchType) => void;
  onSortChange?: (sort: SortOption) => void;
  onFilterPress?: () => void;
  selectedSort?: SortOption;
  totalCount?: number;
}

const SEARCH_TYPES: { value: SearchType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'repositories', label: 'Repositories', icon: 'git-branch' },
  { value: 'topics', label: 'Topics', icon: 'pricetags' },
  { value: 'users', label: 'Users', icon: 'people' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'stars', label: 'Most Stars' },
  { value: 'updated', label: 'Recently Updated' },
  { value: 'created', label: 'Recently Created' },
  { value: 'forks', label: 'Most Forks' },
];

export const SearchResults: React.FC<SearchResultsProps> = ({
  type,
  repositories = [],
  topics = [],
  isLoading = false,
  isError = false,
  onTypeChange,
  onSortChange,
  onFilterPress,
  selectedSort = 'stars',
  totalCount = 0,
}) => {
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  const handleSortChange = (sort: SortOption) => {
    onSortChange?.(sort);
    setSortMenuVisible(false);
  };

  return (
    <View className="flex-1">
      {/* Type Selector */}
      <View className="px-4 pt-4 pb-2 bg-dark-50">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-1"
        >
          <View className="flex-row space-x-2 px-1">
            {SEARCH_TYPES.map((searchType) => (
              <Chip
                key={searchType.value}
                label={searchType.label}
                icon={searchType.icon}
                selected={type === searchType.value}
                onPress={() => onTypeChange?.(searchType.value)}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Sort and Filter Bar */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-dark-50 border-b border-dark-200">
        <View className="flex-row items-center">
          <Ionicons name="funnel" size={16} color="#71717a" />
          <View className="ml-2">
            {totalCount > 0 ? (
              <View className="flex-row items-center">
                <View className="text-dark-400 text-sm">
                  {totalCount.toLocaleString()} results
                </View>
              </View>
            ) : null}
          </View>
        </View>

        <View className="flex-row space-x-2">
          {type === 'repositories' && onSortChange && (
            <Button
              variant="ghost"
              size="sm"
              onPress={() => setSortMenuVisible(!sortMenuVisible)}
            >
              {SORT_OPTIONS.find((s) => s.value === selectedSort)?.label || 'Sort'}
            </Button>
          )}

          {onFilterPress && (
            <Button variant="ghost" size="sm" onPress={onFilterPress}>
              Filters
            </Button>
          )}
        </View>
      </View>

      {/* Sort Menu */}
      {sortMenuVisible && (
        <View className="bg-dark-100 border-b border-dark-200">
          {SORT_OPTIONS.map((sort) => (
            <Button
              key={sort.value}
              variant="ghost"
              size="md"
              onPress={() => handleSortChange(sort.value)}
            >
              <View className="flex-row items-center justify-between w-full">
                <View>{sort.label}</View>
                {selectedSort === sort.value && (
                  <Ionicons name="checkmark" size={20} color="#0284c7" />
                )}
              </View>
            </Button>
          ))}
        </View>
      )}

      {/* Results */}
      <View className="flex-1">
        {type === 'repositories' && (
          <RepositoryList
            repositories={repositories}
            isLoading={isLoading}
            isError={isError}
            isEmpty={repositories.length === 0}
            emptyTitle="No repositories found"
            emptyMessage="Try adjusting your search query or filters."
          />
        )}

        {type === 'topics' && (
          <TopicList
            topics={topics}
            isLoading={isLoading}
            isError={isError}
            emptyTitle="No topics found"
            emptyMessage="Try adjusting your search query."
            showFollowButton={true}
          />
        )}

        {type === 'users' && (
          <View className="flex-1 items-center justify-center p-8">
            <Ionicons name="people-outline" size={64} color="#71717a" />
            <View className="text-white text-lg font-semibold mt-4">
              User search coming soon
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default SearchResults;
