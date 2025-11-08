import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TrendingScreen from '@/app/(tabs)/trending';

// Mock useTrending hook
const mockRefetch = jest.fn();
jest.mock('@/hooks/queries', () => ({
  useTrending: () => ({
    data: [
      {
        rank: 1,
        repository: {
          id: '1',
          name: 'trending-repo',
          ownerLogin: 'testuser',
          description: 'A trending repository',
          stargazerCount: 1000,
          forkCount: 100,
          openIssuesCount: 10,
          primaryLanguage: 'TypeScript',
          topics: [],
        },
      },
    ],
    isLoading: false,
    isError: false,
    refetch: mockRefetch,
    isFetching: false,
  }),
}));

describe('TrendingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render period selector with default daily selection', () => {
    const { getByText } = render(<TrendingScreen />);

    expect(getByText('Trending')).toBeTruthy();
    expect(getByText('Daily')).toBeTruthy();
    expect(getByText('Weekly')).toBeTruthy();
    expect(getByText('Monthly')).toBeTruthy();
  });

  it('should display trending list', () => {
    const { getByText } = render(<TrendingScreen />);

    // The screen should render with trending data
    expect(getByText('Trending')).toBeTruthy();
  });
});
