// User Types
export interface User {
  id: string;
  githubId: string;
  login: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  company?: string;
  location?: string;
  blog?: string;
  twitterUsername?: string;
  publicRepos: number;
  publicGists: number;
  followers: number;
  following: number;
  createdAt: string;
  updatedAt: string;
}

// Repository Types
export interface Repository {
  id: string;
  githubId: string;
  nodeId: string;
  nameWithOwner: string;
  name: string;
  ownerLogin: string;
  description?: string;
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  stargazerCount: number;
  watcherCount: number;
  forkCount: number;
  openIssuesCount: number;
  primaryLanguage?: string;
  languages: Record<string, number>;
  topics: string[];
  htmlUrl: string;
  apiUrl: string;
  cloneUrl?: string;
  createdAt: string;
  updatedAt: string;
  pushedAt?: string;
  lastFetchedAt: string;
}

// Topic Types
export interface Topic {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  repositoryCount: number;
  isFollowed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Trending Types
export interface TrendingItem {
  repository: Repository;
  rank: number;
  stars: number;
  starsToday: number;
  language?: string;
  builtBy: Developer[];
}

export interface Developer {
  username: string;
  url: string;
  avatar: string;
}

// Search Types
export interface SearchResult<T> {
  items: T[];
  totalCount: number;
  hasNextPage: boolean;
  cursor?: string;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Filter Types
export type SortOption = 'stars' | 'updated' | 'created' | 'forks';
export type TrendingPeriod = 'daily' | 'weekly' | 'monthly';
export type SearchType = 'repositories' | 'topics' | 'users';
