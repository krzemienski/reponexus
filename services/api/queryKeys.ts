/**
 * Query Keys Factory for TanStack Query
 *
 * Provides a centralized, type-safe way to manage query keys.
 * Follow best practices for query key structure and invalidation.
 */

export const queryKeys = {
  /**
   * Repository-related query keys
   */
  repositories: {
    all: ['repositories'] as const,
    lists: () => [...queryKeys.repositories.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.repositories.lists(), filters] as const,
    details: () => [...queryKeys.repositories.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.repositories.details(), id] as const,
    readme: (id: string) => [...queryKeys.repositories.detail(id), 'readme'] as const,
    trending: (period: string, language?: string) =>
      ['repositories', 'trending', period, language].filter(Boolean) as const,
  },

  /**
   * Topic-related query keys
   */
  topics: {
    all: ['topics'] as const,
    lists: () => [...queryKeys.topics.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.topics.lists(), filters] as const,
    details: () => [...queryKeys.topics.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.topics.details(), id] as const,
    repositories: (name: string) => [...queryKeys.topics.detail(name), 'repos'] as const,
  },

  /**
   * User-related query keys
   */
  users: {
    all: ['users'] as const,
    current: () => [...queryKeys.users.all, 'current'] as const,
    starred: () => [...queryKeys.users.all, 'starred'] as const,
    topics: () => [...queryKeys.users.all, 'topics'] as const,
    profile: (login: string) => [...queryKeys.users.all, 'profile', login] as const,
  },

  /**
   * Search-related query keys
   */
  search: {
    all: ['search'] as const,
    repositories: (query: string) => [...queryKeys.search.all, 'repositories', query] as const,
    topics: (query: string) => [...queryKeys.search.all, 'topics', query] as const,
  },
} as const;

/**
 * Type-safe query key helpers
 */
export type QueryKeys = typeof queryKeys;

/**
 * Extract query key type from a query key function
 */
export type ExtractQueryKey<T extends (...args: any[]) => readonly any[]> = ReturnType<T>;
