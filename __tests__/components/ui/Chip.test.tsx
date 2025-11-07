import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { Chip } from '../../../components/ui/Chip';

jest.mock('expo-haptics');

describe('Chip Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with label', () => {
      const { getByText } = render(<Chip label="React" />);
      expect(getByText('React')).toBeTruthy();
    });

    it('should render with default variant', () => {
      const { getByText } = render(<Chip label="Default" />);
      expect(getByText('Default')).toBeTruthy();
    });
  });

  describe('Variants', () => {
    it('should render filled variant', () => {
      const { getByText } = render(<Chip label="Filled" variant="filled" />);
      expect(getByText('Filled')).toBeTruthy();
    });

    it('should render outlined variant', () => {
      const { getByText } = render(<Chip label="Outlined" variant="outlined" />);
      expect(getByText('Outlined')).toBeTruthy();
    });
  });

  describe('Selection State', () => {
    it('should render unselected by default', () => {
      const { getByText } = render(<Chip label="Unselected" />);
      expect(getByText('Unselected')).toBeTruthy();
    });

    it('should render selected state', () => {
      const { getByText } = render(<Chip label="Selected" selected />);
      expect(getByText('Selected')).toBeTruthy();
    });

    it('should toggle selection on press', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Chip label="Toggle" onPress={onPress} />
      );

      const chip = getByText('Toggle');
      fireEvent.press(chip);

      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Icon Support', () => {
    it('should render with leading icon', () => {
      const { getByText } = render(
        <Chip label="With Icon" icon="star" />
      );
      expect(getByText('With Icon')).toBeTruthy();
    });
  });

  describe('Disabled State', () => {
    it('should render disabled chip', () => {
      const { getByText } = render(<Chip label="Disabled" disabled />);
      expect(getByText('Disabled')).toBeTruthy();
    });

    it('should not call onPress when disabled', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Chip label="Disabled" disabled onPress={onPress} />
      );

      const chip = getByText('Disabled');
      fireEvent.press(chip);

      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('Haptic Feedback', () => {
    it('should trigger haptic feedback on press', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Chip label="Haptic" onPress={onPress} />
      );

      const chip = getByText('Haptic');
      fireEvent.press(chip);

      expect(Haptics.impactAsync).toHaveBeenCalled();
    });

    it('should not trigger haptic when disabled', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Chip label="No Haptic" disabled onPress={onPress} />
      );

      const chip = getByText('No Haptic');
      fireEvent.press(chip);

      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty label', () => {
      const { getByText } = render(<Chip label="" />);
      expect(getByText('')).toBeTruthy();
    });

    it('should handle long labels', () => {
      const longLabel = 'Very Long Chip Label That Might Need Truncation';
      const { getByText } = render(<Chip label={longLabel} />);
      expect(getByText(longLabel)).toBeTruthy();
    });

    it('should handle special characters', () => {
      const { getByText } = render(<Chip label="C++ & TypeScript" />);
      expect(getByText('C++ & TypeScript')).toBeTruthy();
    });
  });

  describe('Multiple Chips', () => {
    it('should render multiple chips independently', () => {
      const { getByText } = render(
        <>
          <Chip label="Chip 1" />
          <Chip label="Chip 2" selected />
          <Chip label="Chip 3" disabled />
        </>
      );

      expect(getByText('Chip 1')).toBeTruthy();
      expect(getByText('Chip 2')).toBeTruthy();
      expect(getByText('Chip 3')).toBeTruthy();
    });
  });
});
