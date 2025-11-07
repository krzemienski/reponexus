import React from 'react';
import { render } from '@testing-library/react-native';
import { Loading } from '../../../components/ui/Loading';

describe('Loading Component', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      const { getByTestId } = render(<Loading />);
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });

    it('should render with text', () => {
      const { getByText } = render(<Loading text="Loading..." />);
      expect(getByText('Loading...')).toBeTruthy();
    });

    it('should render without text', () => {
      const { queryByText } = render(<Loading />);
      expect(queryByText('Loading...')).toBeNull();
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      const { getByTestId } = render(<Loading size="small" />);
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });

    it('should render large size', () => {
      const { getByTestId } = render(<Loading size="large" />);
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });
  });

  describe('Colors', () => {
    it('should render with custom color', () => {
      const { getByTestId } = render(<Loading color="#FF0000" />);
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });

    it('should render with default color', () => {
      const { getByTestId } = render(<Loading />);
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });
  });

  describe('Fullscreen Mode', () => {
    it('should render fullscreen when prop is true', () => {
      const { getByTestId } = render(<Loading fullscreen />);
      expect(getByTestId('loading-fullscreen')).toBeTruthy();
    });

    it('should not render fullscreen by default', () => {
      const { queryByTestId } = render(<Loading />);
      expect(queryByTestId('loading-fullscreen')).toBeNull();
    });
  });

  describe('With Text Combinations', () => {
    it('should render size and text together', () => {
      const { getByText, getByTestId } = render(
        <Loading size="large" text="Loading data..." />
      );
      expect(getByTestId('loading-indicator')).toBeTruthy();
      expect(getByText('Loading data...')).toBeTruthy();
    });

    it('should render color and text together', () => {
      const { getByText, getByTestId } = render(
        <Loading color="#00FF00" text="Please wait" />
      );
      expect(getByTestId('loading-indicator')).toBeTruthy();
      expect(getByText('Please wait')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text string', () => {
      const { getByText } = render(<Loading text="" />);
      expect(getByText('')).toBeTruthy();
    });

    it('should handle very long text', () => {
      const longText = 'Loading a very long operation that might take a while to complete...';
      const { getByText } = render(<Loading text={longText} />);
      expect(getByText(longText)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessibility role', () => {
      const { getByTestId } = render(<Loading />);
      const indicator = getByTestId('loading-indicator');
      expect(indicator).toBeTruthy();
    });
  });
});
