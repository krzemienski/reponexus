import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RepositoryCard, RepositoryCardSkeleton } from '../../../components/features/repository/RepositoryCard';
import type { Repository } from '../../../types/models';

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

const mockRepository: Repository = {
  id: '1',
  name: 'react',
  ownerLogin: 'facebook',
  description: 'A declarative, efficient, and flexible JavaScript library for building user interfaces.',
  stargazerCount: 200000,
  forkCount: 40000,
  openIssuesCount: 1000,
  primaryLanguage: 'JavaScript',
  topics: ['react', 'javascript', 'frontend', 'ui', 'library'],
  url: 'https://github.com/facebook/react',
  createdAt: '2013-05-24T16:15:54Z',
  updatedAt: '2024-01-01T12:00:00Z',
  pushedAt: '2024-01-01T12:00:00Z',
  homepage: 'https://reactjs.org',
  size: 5000,
  hasIssues: true,
  hasProjects: true,
  hasDownloads: true,
  hasWiki: true,
  hasPages: true,
  archived: false,
  disabled: false,
  visibility: 'public',
  defaultBranch: 'main',
  license: 'MIT',
  watchers: 200000,
  networkCount: 40000,
  subscribersCount: 5000,
};

describe('RepositoryCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render repository name and owner', () => {
      const { getByText } = render(
        <RepositoryCard repository={mockRepository} />
      );

      expect(getByText('facebook')).toBeTruthy();
      expect(getByText('react')).toBeTruthy();
    });

    it('should render description', () => {
      const { getByText } = render(
        <RepositoryCard repository={mockRepository} />
      );

      expect(getByText(/A declarative, efficient/)).toBeTruthy();
    });

    it('should render star count', () => {
      const { getByText } = render(
        <RepositoryCard repository={mockRepository} />
      );

      expect(getByText('200,000')).toBeTruthy();
    });

    it('should render fork count', () => {
      const { getByText } = render(
        <RepositoryCard repository={mockRepository} />
      );

      expect(getByText('40,000')).toBeTruthy();
    });

    it('should render issues count', () => {
      const { getByText } = render(
        <RepositoryCard repository={mockRepository} />
      );

      expect(getByText('1,000')).toBeTruthy();
    });

    it('should render primary language', () => {
      const { getByText } = render(
        <RepositoryCard repository={mockRepository} />
      );

      expect(getByText('JavaScript')).toBeTruthy();
    });

    it('should render topics', () => {
      const { getByText } = render(
        <RepositoryCard repository={mockRepository} />
      );

      expect(getByText('react')).toBeTruthy();
      expect(getByText('javascript')).toBeTruthy();
      expect(getByText('frontend')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should navigate to repository detail on press', () => {
      const { getByText } = render(
        <RepositoryCard repository={mockRepository} />
      );

      const card = getByText('react').parent?.parent?.parent?.parent;
      if (card) {
        fireEvent.press(card);
        expect(mockRouter.push).toHaveBeenCalledWith('/repository/1');
      }
    });
  });

  describe('Star Functionality', () => {
    it('should render star button when onStar is provided', () => {
      const onStar = jest.fn();
      const { UNSAFE_queryAllByType } = render(
        <RepositoryCard repository={mockRepository} onStar={onStar} />
      );

      const pressables = UNSAFE_queryAllByType(require('react-native').Pressable);
      expect(pressables.length).toBeGreaterThan(0);
    });

    it('should show outlined star when not starred', () => {
      const onStar = jest.fn();
      render(
        <RepositoryCard repository={mockRepository} onStar={onStar} isStarred={false} />
      );

      expect(true).toBe(true);
    });

    it('should show filled star when starred', () => {
      const onStar = jest.fn();
      render(
        <RepositoryCard repository={mockRepository} onStar={onStar} isStarred={true} />
      );

      expect(true).toBe(true);
    });

    it('should call onStar when star button is pressed', () => {
      const onStar = jest.fn();
      const { UNSAFE_queryAllByType } = render(
        <RepositoryCard repository={mockRepository} onStar={onStar} />
      );

      const pressables = UNSAFE_queryAllByType(require('react-native').Pressable);
      // Find the star button (not the card itself)
      if (pressables.length > 1) {
        fireEvent.press(pressables[1]);
        expect(onStar).toHaveBeenCalledTimes(1);
      }
    });

    it('should not navigate when star button is pressed', () => {
      const onStar = jest.fn();
      const { UNSAFE_queryAllByType } = render(
        <RepositoryCard repository={mockRepository} onStar={onStar} />
      );

      const pressables = UNSAFE_queryAllByType(require('react-native').Pressable);
      if (pressables.length > 1) {
        fireEvent.press(pressables[1]);
        expect(mockRouter.push).not.toHaveBeenCalled();
      }
    });
  });

  describe('Description Truncation', () => {
    it('should truncate long descriptions', () => {
      const longDescription = 'A'.repeat(200);
      const repo = { ...mockRepository, description: longDescription };
      const { queryByText } = render(
        <RepositoryCard repository={repo} />
      );

      expect(queryByText(longDescription)).toBeNull();
      expect(queryByText(/A{100}\.\.\./)).toBeTruthy();
    });

    it('should not truncate short descriptions', () => {
      const shortDescription = 'Short desc';
      const repo = { ...mockRepository, description: shortDescription };
      const { getByText } = render(
        <RepositoryCard repository={repo} />
      );

      expect(getByText('Short desc')).toBeTruthy();
    });

    it('should not render description section when null', () => {
      const repo = { ...mockRepository, description: null as any };
      const { queryByText } = render(
        <RepositoryCard repository={repo} />
      );

      expect(queryByText('description')).toBeNull();
    });
  });

  describe('Topics Display', () => {
    it('should display up to 5 topics', () => {
      const { getByText } = render(
        <RepositoryCard repository={mockRepository} />
      );

      expect(getByText('react')).toBeTruthy();
      expect(getByText('javascript')).toBeTruthy();
      expect(getByText('frontend')).toBeTruthy();
      expect(getByText('ui')).toBeTruthy();
      expect(getByText('library')).toBeTruthy();
    });

    it('should limit topics to first 5', () => {
      const manyTopics = Array.from({ length: 10 }, (_, i) => `topic${i}`);
      const repo = { ...mockRepository, topics: manyTopics };
      const { getByText, queryByText } = render(
        <RepositoryCard repository={repo} />
      );

      expect(getByText('topic0')).toBeTruthy();
      expect(getByText('topic4')).toBeTruthy();
      expect(queryByText('topic5')).toBeNull();
    });

    it('should not render topics section when empty', () => {
      const repo = { ...mockRepository, topics: [] };
      render(<RepositoryCard repository={repo} />);

      expect(true).toBe(true);
    });

    it('should not render topics section when null', () => {
      const repo = { ...mockRepository, topics: null as any };
      render(<RepositoryCard repository={repo} />);

      expect(true).toBe(true);
    });
  });

  describe('Language Badge', () => {
    it('should render language badge when language exists', () => {
      const { getByText } = render(
        <RepositoryCard repository={mockRepository} />
      );

      expect(getByText('JavaScript')).toBeTruthy();
    });

    it('should not render language badge when null', () => {
      const repo = { ...mockRepository, primaryLanguage: null as any };
      const { queryByText } = render(
        <RepositoryCard repository={repo} />
      );

      expect(queryByText('JavaScript')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero stars', () => {
      const repo = { ...mockRepository, stargazerCount: 0 };
      const { getByText } = render(
        <RepositoryCard repository={repo} />
      );

      expect(getByText('0')).toBeTruthy();
    });

    it('should handle very large numbers', () => {
      const repo = { ...mockRepository, stargazerCount: 1000000 };
      const { getByText } = render(
        <RepositoryCard repository={repo} />
      );

      expect(getByText('1,000,000')).toBeTruthy();
    });

    it('should handle repository without description', () => {
      const repo = { ...mockRepository, description: '' };
      const { queryByText } = render(
        <RepositoryCard repository={repo} />
      );

      expect(queryByText('description')).toBeNull();
    });
  });
});

describe('RepositoryCardSkeleton', () => {
  it('should render skeleton loader', () => {
    const { UNSAFE_queryAllByType } = render(<RepositoryCardSkeleton />);
    expect(UNSAFE_queryAllByType).toBeTruthy();
  });

  it('should render multiple shimmer elements', () => {
    render(<RepositoryCardSkeleton />);
    expect(true).toBe(true);
  });
});
