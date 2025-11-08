import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TopicCard } from '@/components/features/topic/TopicCard';
import type { Topic } from '@/types/models';

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

describe('TopicCard Component', () => {
  const mockTopic: Topic = {
    id: '1',
    name: 'react',
    displayName: 'React',
    description: 'A JavaScript library for building user interfaces',
    repositoryCount: 5000,
    isFollowed: false,
  };

  beforeEach(() => {
    mockPush.mockClear();
  });

  it('should render topic information correctly', () => {
    const { getByText } = render(<TopicCard topic={mockTopic} />);

    expect(getByText('React')).toBeTruthy();
    expect(getByText('react')).toBeTruthy();
    expect(getByText('5,000 repositories')).toBeTruthy();
  });

  it('should toggle follow button when clicked', () => {
    const mockOnFollow = jest.fn();
    const { getByText } = render(
      <TopicCard topic={mockTopic} onFollow={mockOnFollow} showFollowButton />
    );

    const followButton = getByText('Follow');
    fireEvent.press(followButton);

    expect(mockOnFollow).toHaveBeenCalled();
  });
});
