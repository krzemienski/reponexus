import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RepositoryCard } from '@/components/features/repository/RepositoryCard';
import type { Repository } from '@/types/models';

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

describe('RepositoryCard Component', () => {
  const mockRepository: Repository = {
    id: '1',
    name: 'react',
    ownerLogin: 'facebook',
    description: 'A JavaScript library for building user interfaces',
    stargazerCount: 1000,
    forkCount: 500,
    openIssuesCount: 100,
    primaryLanguage: 'JavaScript',
    topics: ['ui', 'library', 'react'],
    url: 'https://github.com/facebook/react',
    homepageUrl: null,
    createdAt: '2013-05-24T16:15:54Z',
    pushedAt: '2024-01-01T12:00:00Z',
    isPrivate: false,
    isFork: false,
  };

  beforeEach(() => {
    mockPush.mockClear();
  });

  it('should render repository information correctly', () => {
    const { getByText } = render(<RepositoryCard repository={mockRepository} />);

    expect(getByText('react')).toBeTruthy();
    expect(getByText('facebook')).toBeTruthy();
    expect(getByText('1,000')).toBeTruthy();
    expect(getByText('JavaScript')).toBeTruthy();
  });

  it('should navigate to repository detail on press', () => {
    const { getByText } = render(<RepositoryCard repository={mockRepository} />);

    fireEvent.press(getByText('react'));

    expect(mockPush).toHaveBeenCalledWith('/repository/1');
  });

  it('should call onStar when star button is pressed', () => {
    const mockOnStar = jest.fn();
    const { UNSAFE_getByType } = render(
      <RepositoryCard
        repository={mockRepository}
        onStar={mockOnStar}
        isStarred={false}
      />
    );

    // Find all Pressable components
    const pressables = UNSAFE_getByType(
      require('react-native').Pressable
    );

    // The star button is wrapped in a Pressable, fire the press event
    // Note: This might need adjustment based on actual component structure
    fireEvent.press(pressables);

    expect(mockOnStar).toHaveBeenCalled();
  });
});
