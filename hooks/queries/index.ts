/**
 * Query Hooks Index
 *
 * Central export file for all query hooks.
 */

// Repository hooks
export {
  useRepositories,
  useRepository,
  useInfiniteRepositories,
  useTrending,
  useRepositoryReadme,
  useIsRepositoryStarred,
} from './useRepositories';

// Topic hooks
export {
  useTopics,
  useTopic,
  useUserTopics,
  useTopicRepositories,
  useInfiniteTopics,
  useInfiniteTopicRepositories,
  useIsFollowingTopic,
} from './useTopics';

// User hooks
export {
  useCurrentUser,
  useUserProfile,
  useStarredRepositories,
  useInfiniteStarredRepositories,
  useIsAuthenticated,
  useUserStats,
} from './useUser';

// Search hooks
export {
  useDebounce,
  useSearchRepositories,
  useSearchTopics,
  useInfiniteSearchRepositories,
  useInfiniteSearchTopics,
  useSearchSuggestions,
} from './useSearch';

// Mutation hooks
export {
  useFollowTopic,
  useUnfollowTopic,
  useStarRepository,
  useUnstarRepository,
  useUpdateProfile,
  useToggleRepositoryStar,
  useToggleTopicFollow,
} from './useMutations';

// Trending hooks
export {
  useTrendingRepositories,
  useFeaturedRepositories,
  useTrendingConfig,
  useTrendingStats,
  getTrendingScoreColor,
  formatTrendingScore,
} from './useTrending';
export type { TrendingRepository, TrendingConfig, TrendingStats } from './useTrending';
