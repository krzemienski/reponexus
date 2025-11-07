import React from 'react';
import { render } from '@testing-library/react-native';
import { Badge } from '../../../components/ui/Badge';

describe('Badge Component', () => {
  describe('Rendering', () => {
    it('should render with default variant', () => {
      const { getByText } = render(<Badge label="New" />);
      expect(getByText('New')).toBeTruthy();
    });

    it('should render with text content', () => {
      const { getByText } = render(<Badge label="Badge Text" />);
      expect(getByText('Badge Text')).toBeTruthy();
    });
  });

  describe('Variants', () => {
    it('should render primary variant', () => {
      const { getByText } = render(<Badge label="Primary" variant="primary" />);
      expect(getByText('Primary')).toBeTruthy();
    });

    it('should render secondary variant', () => {
      const { getByText } = render(<Badge label="Secondary" variant="secondary" />);
      expect(getByText('Secondary')).toBeTruthy();
    });

    it('should render success variant', () => {
      const { getByText } = render(<Badge label="Success" variant="success" />);
      expect(getByText('Success')).toBeTruthy();
    });

    it('should render warning variant', () => {
      const { getByText } = render(<Badge label="Warning" variant="warning" />);
      expect(getByText('Warning')).toBeTruthy();
    });

    it('should render error variant', () => {
      const { getByText } = render(<Badge label="Error" variant="error" />);
      expect(getByText('Error')).toBeTruthy();
    });

    it('should render info variant', () => {
      const { getByText } = render(<Badge label="Info" variant="info" />);
      expect(getByText('Info')).toBeTruthy();
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      const { getByText } = render(<Badge label="Small" size="sm" />);
      expect(getByText('Small')).toBeTruthy();
    });

    it('should render medium size (default)', () => {
      const { getByText } = render(<Badge label="Medium" size="md" />);
      expect(getByText('Medium')).toBeTruthy();
    });

    it('should render large size', () => {
      const { getByText } = render(<Badge label="Large" size="lg" />);
      expect(getByText('Large')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const { getByText } = render(<Badge label="" />);
      expect(getByText('')).toBeTruthy();
    });

    it('should handle long text', () => {
      const longText = 'Very Long Badge Text That Might Overflow';
      const { getByText } = render(<Badge label={longText} />);
      expect(getByText(longText)).toBeTruthy();
    });

    it('should handle numbers', () => {
      const { getByText } = render(<Badge label="99+" />);
      expect(getByText('99+')).toBeTruthy();
    });
  });
});
