import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ExploreScreen from '@/app/(tabs)/explore';

// Mock useRepositories hook
const mockRefetch = jest.fn();
jest.mock('@/hooks/queries', () => ({
  useRepositories: () => ({
    data: {
      data: [
        {
          id: '1',
          name: 'test-repo',
          ownerLogin: 'testuser',
          description: 'A test repository',
          stargazerCount: 100,
          forkCount: 10,
          openIssuesCount: 5,
          primaryLanguage: 'TypeScript',
          topics: ['react', 'typescript'],
        },
      ],
      pagination: { page: 1, pages: 1, total: 1, perPage: 20 },
    },
    isLoading: false,
    isError: false,
    refetch: mockRefetch,
    isFetching: false,
  }),
}));

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

describe('ExploreScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render repository list', () => {
    const { getByText } = render(<ExploreScreen />);

    expect(getByText('Explore')).toBeTruthy();
    expect(getByText('Featured Repositories')).toBeTruthy();
  });

  it('should handle search functionality', () => {
    const { getByPlaceholderText } = render(<ExploreScreen />);

    const searchInput = getByPlaceholderText('Search repositories, topics...');
    fireEvent.changeText(searchInput, 'react');

    expect(searchInput.props.value).toBe('react');
  });
});
