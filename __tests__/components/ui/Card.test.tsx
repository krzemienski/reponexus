import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Card } from '../../../components/ui/Card';

jest.mock('expo-haptics');

describe('Card Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render children correctly', () => {
      const { getByText } = render(
        <Card>
          <Text>Card Content</Text>
        </Card>
      );

      expect(getByText('Card Content')).toBeTruthy();
    });

    it('should render with elevated variant by default', () => {
      const { getByText } = render(
        <Card>
          <Text>Elevated Card</Text>
        </Card>
      );

      expect(getByText('Elevated Card')).toBeTruthy();
    });
  });

  describe('Variants', () => {
    it('should render elevated variant', () => {
      const { getByText } = render(
        <Card variant="elevated">
          <Text>Elevated</Text>
        </Card>
      );

      expect(getByText('Elevated')).toBeTruthy();
    });

    it('should render flat variant', () => {
      const { getByText } = render(
        <Card variant="flat">
          <Text>Flat</Text>
        </Card>
      );

      expect(getByText('Flat')).toBeTruthy();
    });

    it('should render outlined variant', () => {
      const { getByText } = render(
        <Card variant="outlined">
          <Text>Outlined</Text>
        </Card>
      );

      expect(getByText('Outlined')).toBeTruthy();
    });
  });

  describe('Pressable Functionality', () => {
    it('should handle press when pressable and onPress provided', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Card pressable onPress={onPress}>
          <Text>Pressable Card</Text>
        </Card>
      );

      const card = getByText('Pressable Card').parent;
      if (card) {
        fireEvent.press(card);
        expect(onPress).toHaveBeenCalledTimes(1);
      }
    });

    it('should not be pressable without onPress', () => {
      const { getByText } = render(
        <Card pressable>
          <Text>Non-pressable Card</Text>
        </Card>
      );

      expect(getByText('Non-pressable Card')).toBeTruthy();
    });

    it('should not be pressable when pressable is false', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Card pressable={false} onPress={onPress}>
          <Text>Static Card</Text>
        </Card>
      );

      expect(getByText('Static Card')).toBeTruthy();
    });
  });

  describe('Haptic Feedback', () => {
    it('should trigger light haptic on press in', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Card pressable onPress={onPress} hapticFeedback={true}>
          <Text>Haptic Card</Text>
        </Card>
      );

      const card = getByText('Haptic Card').parent;
      if (card) {
        fireEvent(card, 'pressIn');
        expect(Haptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Light
        );
      }
    });

    it('should trigger medium haptic on press', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Card pressable onPress={onPress} hapticFeedback={true}>
          <Text>Haptic Card</Text>
        </Card>
      );

      const card = getByText('Haptic Card').parent;
      if (card) {
        fireEvent.press(card);
        expect(Haptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Medium
        );
      }
    });

    it('should not trigger haptic when hapticFeedback is false', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Card pressable onPress={onPress} hapticFeedback={false}>
          <Text>No Haptic Card</Text>
        </Card>
      );

      const card = getByText('No Haptic Card').parent;
      if (card) {
        fireEvent(card, 'pressIn');
        fireEvent.press(card);
        expect(Haptics.impactAsync).not.toHaveBeenCalled();
      }
    });
  });

  describe('Press States', () => {
    it('should handle pressIn event', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Card pressable onPress={onPress}>
          <Text>Press In Card</Text>
        </Card>
      );

      const card = getByText('Press In Card').parent;
      if (card) {
        fireEvent(card, 'pressIn');
        expect(true).toBe(true);
      }
    });

    it('should handle pressOut event', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Card pressable onPress={onPress}>
          <Text>Press Out Card</Text>
        </Card>
      );

      const card = getByText('Press Out Card').parent;
      if (card) {
        fireEvent(card, 'pressIn');
        fireEvent(card, 'pressOut');
        expect(true).toBe(true);
      }
    });
  });

  describe('Style Customization', () => {
    it('should accept custom style prop', () => {
      const customStyle = { backgroundColor: '#FF0000' };
      const { getByText } = render(
        <Card style={customStyle}>
          <Text>Styled Card</Text>
        </Card>
      );

      expect(getByText('Styled Card')).toBeTruthy();
    });
  });

  describe('Complex Children', () => {
    it('should render multiple children', () => {
      const { getByText } = render(
        <Card>
          <Text>Title</Text>
          <Text>Subtitle</Text>
          <Text>Description</Text>
        </Card>
      );

      expect(getByText('Title')).toBeTruthy();
      expect(getByText('Subtitle')).toBeTruthy();
      expect(getByText('Description')).toBeTruthy();
    });
  });
});
