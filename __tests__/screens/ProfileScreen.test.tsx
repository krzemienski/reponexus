import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ProfileScreen from '@/app/(tabs)/profile';

// Mock useCurrentUser hook
jest.mock('@/hooks/queries', () => ({
  useCurrentUser: () => ({
    data: {
      id: '1',
      login: 'testuser',
      name: 'Test User',
      avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
      bio: 'Software developer',
      company: 'Test Company',
      location: 'San Francisco',
      blog: 'https://testuser.dev',
      twitterUsername: 'testuser',
      publicRepos: 50,
      followers: 100,
      following: 75,
      email: 'test@example.com',
      createdAt: '2020-01-01T00:00:00Z',
    },
    isLoading: false,
    isError: false,
    error: null,
  }),
}));

// Mock expo-router
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    back: jest.fn(),
  }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display user information', () => {
    const { getByText } = render(<ProfileScreen />);

    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('@testuser')).toBeTruthy();
    expect(getByText('Software developer')).toBeTruthy();
    expect(getByText('50')).toBeTruthy(); // Public repos
    expect(getByText('100')).toBeTruthy(); // Followers
  });

  it('should show sign out confirmation dialog', () => {
    const { getByText } = render(<ProfileScreen />);

    const signOutButton = getByText('Sign Out');
    fireEvent.press(signOutButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Sign Out',
      'Are you sure you want to sign out?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Sign Out' }),
      ])
    );
  });
});
