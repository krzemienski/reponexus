import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Modal } from '../../../components/ui/Modal';

describe('Modal Component', () => {
  describe('Visibility', () => {
    it('should not render when visible is false', () => {
      const { queryByText } = render(
        <Modal visible={false} onClose={jest.fn()}>
          <Text>Modal Content</Text>
        </Modal>
      );

      expect(queryByText('Modal Content')).toBeNull();
    });

    it('should render when visible is true', () => {
      const { getByText } = render(
        <Modal visible={true} onClose={jest.fn()}>
          <Text>Modal Content</Text>
        </Modal>
      );

      expect(getByText('Modal Content')).toBeTruthy();
    });
  });

  describe('Content Rendering', () => {
    it('should render children', () => {
      const { getByText } = render(
        <Modal visible={true} onClose={jest.fn()}>
          <Text>Child Content</Text>
        </Modal>
      );

      expect(getByText('Child Content')).toBeTruthy();
    });

    it('should render title when provided', () => {
      const { getByText } = render(
        <Modal visible={true} title="Test Title" onClose={jest.fn()}>
          <Text>Content</Text>
        </Modal>
      );

      expect(getByText('Test Title')).toBeTruthy();
    });

    it('should render without title', () => {
      const { getByText } = render(
        <Modal visible={true} onClose={jest.fn()}>
          <Text>Content</Text>
        </Modal>
      );

      expect(getByText('Content')).toBeTruthy();
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when backdrop is pressed', () => {
      const onClose = jest.fn();
      const { getByTestId } = render(
        <Modal visible={true} onClose={onClose}>
          <Text>Content</Text>
        </Modal>
      );

      const backdrop = getByTestId('modal-backdrop');
      fireEvent.press(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when close button is pressed', () => {
      const onClose = jest.fn();
      const { getByTestId } = render(
        <Modal visible={true} onClose={onClose} showCloseButton={true}>
          <Text>Content</Text>
        </Modal>
      );

      const closeButton = getByTestId('modal-close-button');
      fireEvent.press(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not close when content is pressed', () => {
      const onClose = jest.fn();
      const { getByText } = render(
        <Modal visible={true} onClose={onClose}>
          <Text>Content</Text>
        </Modal>
      );

      const content = getByText('Content');
      fireEvent.press(content);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Dismissable Behavior', () => {
    it('should close on backdrop press when dismissable is true', () => {
      const onClose = jest.fn();
      const { getByTestId } = render(
        <Modal visible={true} onClose={onClose} dismissable={true}>
          <Text>Content</Text>
        </Modal>
      );

      const backdrop = getByTestId('modal-backdrop');
      fireEvent.press(backdrop);

      expect(onClose).toHaveBeenCalled();
    });

    it('should not close on backdrop press when dismissable is false', () => {
      const onClose = jest.fn();
      const { getByTestId } = render(
        <Modal visible={true} onClose={onClose} dismissable={false}>
          <Text>Content</Text>
        </Modal>
      );

      const backdrop = getByTestId('modal-backdrop');
      fireEvent.press(backdrop);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Animations', () => {
    it('should render with slide animation type', () => {
      const { getByText } = render(
        <Modal visible={true} onClose={jest.fn()} animationType="slide">
          <Text>Slide Modal</Text>
        </Modal>
      );

      expect(getByText('Slide Modal')).toBeTruthy();
    });

    it('should render with fade animation type', () => {
      const { getByText } = render(
        <Modal visible={true} onClose={jest.fn()} animationType="fade">
          <Text>Fade Modal</Text>
        </Modal>
      );

      expect(getByText('Fade Modal')).toBeTruthy();
    });
  });

  describe('Complex Content', () => {
    it('should render complex nested content', () => {
      const { getByText } = render(
        <Modal visible={true} title="Complex Modal" onClose={jest.fn()}>
          <Text>Title</Text>
          <Text>Description</Text>
          <Text>Footer</Text>
        </Modal>
      );

      expect(getByText('Title')).toBeTruthy();
      expect(getByText('Description')).toBeTruthy();
      expect(getByText('Footer')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid visibility toggles', () => {
      const { getByText, queryByText, rerender } = render(
        <Modal visible={true} onClose={jest.fn()}>
          <Text>Content</Text>
        </Modal>
      );

      expect(getByText('Content')).toBeTruthy();

      rerender(
        <Modal visible={false} onClose={jest.fn()}>
          <Text>Content</Text>
        </Modal>
      );

      expect(queryByText('Content')).toBeNull();

      rerender(
        <Modal visible={true} onClose={jest.fn()}>
          <Text>Content</Text>
        </Modal>
      );

      expect(getByText('Content')).toBeTruthy();
    });
  });
});
