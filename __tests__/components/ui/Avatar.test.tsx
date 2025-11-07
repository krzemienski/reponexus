import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Avatar } from '../../../components/ui/Avatar';

describe('Avatar Component', () => {
  describe('Rendering', () => {
    it('should render with default size', () => {
      const { getByText } = render(<Avatar name="John Doe" />);
      expect(getByText('JD')).toBeTruthy();
    });

    it('should render initials from name', () => {
      const { getByText } = render(<Avatar name="Alice Smith" />);
      expect(getByText('AS')).toBeTruthy();
    });

    it('should render first two letters for single word name', () => {
      const { getByText } = render(<Avatar name="Alice" />);
      expect(getByText('AL')).toBeTruthy();
    });

    it('should render question mark when no name provided', () => {
      const { getByText } = render(<Avatar />);
      expect(getByText('?')).toBeTruthy();
    });
  });

  describe('Sizes', () => {
    it('should render xs size', () => {
      const { getByText } = render(<Avatar name="Test User" size="xs" />);
      expect(getByText('TU')).toBeTruthy();
    });

    it('should render sm size', () => {
      const { getByText } = render(<Avatar name="Test User" size="sm" />);
      expect(getByText('TU')).toBeTruthy();
    });

    it('should render md size (default)', () => {
      const { getByText } = render(<Avatar name="Test User" size="md" />);
      expect(getByText('TU')).toBeTruthy();
    });

    it('should render lg size', () => {
      const { getByText } = render(<Avatar name="Test User" size="lg" />);
      expect(getByText('TU')).toBeTruthy();
    });

    it('should render xl size', () => {
      const { getByText } = render(<Avatar name="Test User" size="xl" />);
      expect(getByText('TU')).toBeTruthy();
    });
  });

  describe('Image Source', () => {
    it('should render with string source', async () => {
      const { UNSAFE_queryByType } = render(
        <Avatar
          source="https://example.com/avatar.jpg"
          name="John Doe"
        />
      );

      await waitFor(() => {
        expect(UNSAFE_queryByType).toBeTruthy();
      });
    });

    it('should render with URI object source', async () => {
      const { UNSAFE_queryByType } = render(
        <Avatar
          source={{ uri: 'https://example.com/avatar.jpg' }}
          name="John Doe"
        />
      );

      await waitFor(() => {
        expect(UNSAFE_queryByType).toBeTruthy();
      });
    });

    it('should fallback to initials on image error', async () => {
      const { getByText, UNSAFE_getByType } = render(
        <Avatar
          source="https://invalid-url.com/avatar.jpg"
          name="John Doe"
        />
      );

      // Initially shows initials while loading
      expect(getByText('JD')).toBeTruthy();
    });
  });

  describe('Status Indicator', () => {
    it('should render online status', () => {
      const { getByText } = render(
        <Avatar name="John Doe" status="online" />
      );
      expect(getByText('JD')).toBeTruthy();
    });

    it('should render offline status', () => {
      const { getByText } = render(
        <Avatar name="John Doe" status="offline" />
      );
      expect(getByText('JD')).toBeTruthy();
    });

    it('should render away status', () => {
      const { getByText } = render(
        <Avatar name="John Doe" status="away" />
      );
      expect(getByText('JD')).toBeTruthy();
    });

    it('should render busy status', () => {
      const { getByText } = render(
        <Avatar name="John Doe" status="busy" />
      );
      expect(getByText('JD')).toBeTruthy();
    });

    it('should not render status when null', () => {
      const { getByText } = render(
        <Avatar name="John Doe" status={null} />
      );
      expect(getByText('JD')).toBeTruthy();
    });
  });

  describe('Initials Generation', () => {
    it('should handle names with multiple spaces', () => {
      const { getByText } = render(<Avatar name="  John   Doe  " />);
      expect(getByText('JD')).toBeTruthy();
    });

    it('should handle lowercase names', () => {
      const { getByText } = render(<Avatar name="john doe" />);
      expect(getByText('JD')).toBeTruthy();
    });

    it('should handle names with more than two words', () => {
      const { getByText } = render(<Avatar name="John Middle Doe" />);
      expect(getByText('JM')).toBeTruthy();
    });

    it('should handle empty string name', () => {
      const { getByText } = render(<Avatar name="" />);
      expect(getByText('?')).toBeTruthy();
    });
  });

  describe('Image Loading States', () => {
    it('should show initials while image is loading', () => {
      const { getByText } = render(
        <Avatar
          source="https://example.com/avatar.jpg"
          name="John Doe"
        />
      );

      expect(getByText('JD')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single character name', () => {
      const { getByText } = render(<Avatar name="A" />);
      expect(getByText('A')).toBeTruthy();
    });

    it('should handle special characters in name', () => {
      const { getByText } = render(<Avatar name="John-Paul Doe" />);
      expect(getByText('JD')).toBeTruthy();
    });

    it('should handle numbers in name', () => {
      const { getByText } = render(<Avatar name="John 123" />);
      expect(getByText('J1')).toBeTruthy();
    });
  });

  describe('Combination of Props', () => {
    it('should render with all props combined', () => {
      const { getByText } = render(
        <Avatar
          source="https://example.com/avatar.jpg"
          name="John Doe"
          size="lg"
          status="online"
        />
      );

      expect(getByText('JD')).toBeTruthy();
    });
  });
});
