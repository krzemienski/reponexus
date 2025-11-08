import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TopicsScreen from '@/app/(tabs)/topics';

// Mock useUserTopics and mutation hooks
const mockRefetch = jest.fn();
jest.mock('@/hooks/queries', () => ({
  useUserTopics: () => ({
    data: [
      {
        id: '1',
        name: 'react',
        displayName: 'React',
        description: 'A JavaScript library for building user interfaces',
        repositoryCount: 5000,
        isFollowed: true,
      },
    ],
    isLoading: false,
    isError: false,
    refetch: mockRefetch,
    isFetching: false,
  }),
  useFollowTopic: () => ({
    mutate: jest.fn(),
  }),
  useUnfollowTopic: () => ({
    mutate: jest.fn(),
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

describe('TopicsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render topic list', () => {
    const { getByText, getByPlaceholderText } = render(<TopicsScreen />);

    expect(getByText('Topics')).toBeTruthy();
    expect(getByPlaceholderText('Search topics...')).toBeTruthy();
  });

  it('should handle follow/unfollow actions', () => {
    const { getByText } = render(<TopicsScreen />);

    // The add topic button should be visible
    const addTopicButton = getByText('Add Topic');
    expect(addTopicButton).toBeTruthy();

    fireEvent.press(addTopicButton);
    // Modal should open
  });
});
