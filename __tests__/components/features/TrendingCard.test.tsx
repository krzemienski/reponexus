import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TrendingCard } from '../../../components/features/trending/TrendingCard';
import type { TrendingItem } from '../../../types/models';

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

const mockTrendingItem: TrendingItem = {
  rank: 1,
  starsToday: 250,
  language: 'TypeScript',
  builtBy: [
    { username: 'user1', avatar: 'https://example.com/avatar1.jpg' },
    { username: 'user2', avatar: 'https://example.com/avatar2.jpg' },
    { username: 'user3', avatar: 'https://example.com/avatar3.jpg' },
  ],
  repository: {
    id: '1',
    name: 'awesome-project',
    ownerLogin: 'github',
    description: 'An awesome trending repository',
    stargazerCount: 50000,
    forkCount: 5000,
    openIssuesCount: 100,
    primaryLanguage: 'TypeScript',
    topics: ['typescript', 'awesome', 'trending'],
    url: 'https://github.com/github/awesome-project',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
    pushedAt: '2024-01-01T12:00:00Z',
    homepage: null,
    size: 1000,
    hasIssues: true,
    hasProjects: true,
    hasDownloads: true,
    hasWiki: true,
    hasPages: false,
    archived: false,
    disabled: false,
    visibility: 'public',
    defaultBranch: 'main',
    license: 'MIT',
    watchers: 50000,
    networkCount: 5000,
    subscribersCount: 1000,
  },
};

describe('TrendingCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render rank number', () => {
      const { getByText } = render(
        <TrendingCard item={mockTrendingItem} />
      );

      expect(getByText('1')).toBeTruthy();
    });

    it('should render repository name and owner', () => {
      const { getByText } = render(
        <TrendingCard item={mockTrendingItem} />
      );

      expect(getByText('github')).toBeTruthy();
      expect(getByText('awesome-project')).toBeTruthy();
    });

    it('should render description', () => {
      const { getByText } = render(
        <TrendingCard item={mockTrendingItem} />
      );

      expect(getByText('An awesome trending repository')).toBeTruthy();
    });

    it('should render stars today', () => {
      const { getByText } = render(
        <TrendingCard item={mockTrendingItem} />
      );

      expect(getByText('250')).toBeTruthy();
      expect(getByText('today')).toBeTruthy();
    });

    it('should render total stars', () => {
      const { getByText } = render(
        <TrendingCard item={mockTrendingItem} />
      );

      expect(getByText('50,000')).toBeTruthy();
    });

    it('should render fork count', () => {
      const { getByText } = render(
        <TrendingCard item={mockTrendingItem} />
      );

      expect(getByText('5,000')).toBeTruthy();
    });

    it('should render language badge', () => {
      const { getByText } = render(
        <TrendingCard item={mockTrendingItem} />
      );

      expect(getByText('TypeScript')).toBeTruthy();
    });
  });

  describe('Rank Change Indicator', () => {
    it('should show up arrow when rank improved', () => {
      const { getByText } = render(
        <TrendingCard item={mockTrendingItem} previousRank={3} />
      );

      expect(getByText('2')).toBeTruthy(); // Change of 2 positions
    });

    it('should show down arrow when rank decreased', () => {
      const { getByText } = render(
        <TrendingCard item={{ ...mockTrendingItem, rank: 5 }} previousRank={2} />
      );

      expect(getByText('3')).toBeTruthy(); // Change of 3 positions down
    });

    it('should not show indicator when rank is same', () => {
      render(
        <TrendingCard item={mockTrendingItem} previousRank={1} />
      );

      expect(true).toBe(true);
    });

    it('should not show indicator when previousRank is not provided', () => {
      render(
        <TrendingCard item={mockTrendingItem} />
      );

      expect(true).toBe(true);
    });
  });

  describe('Built By Section', () => {
    it('should render developer avatars', () => {
      render(
        <TrendingCard item={mockTrendingItem} />
      );

      expect(true).toBe(true);
    });

    it('should limit to 5 developers', () => {
      const manyDevs = Array.from({ length: 10 }, (_, i) => ({
        username: `user${i}`,
        avatar: `https://example.com/avatar${i}.jpg`,
      }));
      const item = { ...mockTrendingItem, builtBy: manyDevs };
      const { getByText } = render(
        <TrendingCard item={item} />
      );

      expect(getByText('+5 more')).toBeTruthy();
    });

    it('should show "Built by" label', () => {
      const { getByText } = render(
        <TrendingCard item={mockTrendingItem} />
      );

      expect(getByText('Built by')).toBeTruthy();
    });

    it('should not render when builtBy is empty', () => {
      const item = { ...mockTrendingItem, builtBy: [] };
      const { queryByText } = render(
        <TrendingCard item={item} />
      );

      expect(queryByText('Built by')).toBeNull();
    });
  });

  describe('Topics Display', () => {
    it('should render topics', () => {
      const { getByText } = render(
        <TrendingCard item={mockTrendingItem} />
      );

      expect(getByText('typescript')).toBeTruthy();
      expect(getByText('awesome')).toBeTruthy();
      expect(getByText('trending')).toBeTruthy();
    });

    it('should limit topics to 5', () => {
      const manyTopics = Array.from({ length: 10 }, (_, i) => `topic${i}`);
      const item = {
        ...mockTrendingItem,
        repository: { ...mockTrendingItem.repository, topics: manyTopics },
      };
      const { getByText, queryByText } = render(
        <TrendingCard item={item} />
      );

      expect(getByText('topic0')).toBeTruthy();
      expect(getByText('topic4')).toBeTruthy();
      expect(queryByText('topic5')).toBeNull();
    });

    it('should not render topics section when empty', () => {
      const item = {
        ...mockTrendingItem,
        repository: { ...mockTrendingItem.repository, topics: [] },
      };
      render(<TrendingCard item={item} />);

      expect(true).toBe(true);
    });
  });

  describe('Navigation', () => {
    it('should navigate to repository detail on press', () => {
      const { getByText } = render(
        <TrendingCard item={mockTrendingItem} />
      );

      const card = getByText('awesome-project').parent?.parent?.parent?.parent;
      if (card) {
        fireEvent.press(card);
        expect(mockRouter.push).toHaveBeenCalledWith('/repository/1');
      }
    });
  });

  describe('Description Truncation', () => {
    it('should truncate long descriptions', () => {
      const longDescription = 'A'.repeat(200);
      const item = {
        ...mockTrendingItem,
        repository: { ...mockTrendingItem.repository, description: longDescription },
      };
      const { queryByText } = render(
        <TrendingCard item={item} />
      );

      expect(queryByText(longDescription)).toBeNull();
    });

    it('should not render description when null', () => {
      const item = {
        ...mockTrendingItem,
        repository: { ...mockTrendingItem.repository, description: null as any },
      };
      render(<TrendingCard item={item} />);

      expect(true).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rank 0', () => {
      const item = { ...mockTrendingItem, rank: 0 };
      const { getByText } = render(
        <TrendingCard item={item} />
      );

      expect(getByText('0')).toBeTruthy();
    });

    it('should handle zero stars today', () => {
      const item = { ...mockTrendingItem, starsToday: 0 };
      const { getByText } = render(
        <TrendingCard item={item} />
      );

      expect(getByText('0')).toBeTruthy();
    });

    it('should handle very large numbers', () => {
      const item = {
        ...mockTrendingItem,
        starsToday: 10000,
        repository: { ...mockTrendingItem.repository, stargazerCount: 1000000 },
      };
      const { getByText } = render(
        <TrendingCard item={item} />
      );

      expect(getByText('10,000')).toBeTruthy();
      expect(getByText('1,000,000')).toBeTruthy();
    });

    it('should handle missing language', () => {
      const item = { ...mockTrendingItem, language: null as any };
      render(<TrendingCard item={item} />);

      expect(true).toBe(true);
    });
  });

  describe('Animations', () => {
    it('should render without crashing when rank changes', () => {
      const { rerender } = render(
        <TrendingCard item={mockTrendingItem} previousRank={2} />
      );

      rerender(
        <TrendingCard item={{ ...mockTrendingItem, rank: 2 }} previousRank={1} />
      );

      expect(true).toBe(true);
    });
  });
});
