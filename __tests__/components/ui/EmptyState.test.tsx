import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EmptyState } from '../../../components/ui/EmptyState';

describe('EmptyState Component', () => {
  describe('Rendering', () => {
    it('should render with title', () => {
      const { getByText } = render(
        <EmptyState title="No Data" />
      );
      expect(getByText('No Data')).toBeTruthy();
    });

    it('should render with title and description', () => {
      const { getByText } = render(
        <EmptyState
          title="No Results"
          description="Try adjusting your search"
        />
      );
      expect(getByText('No Results')).toBeTruthy();
      expect(getByText('Try adjusting your search')).toBeTruthy();
    });

    it('should render without description', () => {
      const { getByText, queryByText } = render(
        <EmptyState title="Empty" />
      );
      expect(getByText('Empty')).toBeTruthy();
      expect(queryByText('description')).toBeNull();
    });
  });

  describe('Icon Support', () => {
    it('should render with icon', () => {
      const { getByText } = render(
        <EmptyState
          icon="search-outline"
          title="No Search Results"
        />
      );
      expect(getByText('No Search Results')).toBeTruthy();
    });

    it('should render without icon', () => {
      const { getByText } = render(
        <EmptyState title="No Icon" />
      );
      expect(getByText('No Icon')).toBeTruthy();
    });
  });

  describe('Action Button', () => {
    it('should render action button when provided', () => {
      const onAction = jest.fn();
      const { getByText } = render(
        <EmptyState
          title="No Items"
          actionLabel="Add Item"
          onAction={onAction}
        />
      );
      expect(getByText('Add Item')).toBeTruthy();
    });

    it('should call onAction when button is pressed', () => {
      const onAction = jest.fn();
      const { getByText } = render(
        <EmptyState
          title="No Items"
          actionLabel="Add Item"
          onAction={onAction}
        />
      );

      const button = getByText('Add Item');
      fireEvent.press(button);

      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('should not render action button when actionLabel is not provided', () => {
      const onAction = jest.fn();
      const { queryByText } = render(
        <EmptyState title="No Items" onAction={onAction} />
      );
      expect(queryByText('action')).toBeNull();
    });

    it('should not render action button when onAction is not provided', () => {
      const { queryByText } = render(
        <EmptyState title="No Items" actionLabel="Add Item" />
      );
      expect(queryByText('Add Item')).toBeNull();
    });
  });

  describe('Complete Configurations', () => {
    it('should render all props together', () => {
      const onAction = jest.fn();
      const { getByText } = render(
        <EmptyState
          icon="folder-open-outline"
          title="No Files"
          description="Upload your first file to get started"
          actionLabel="Upload File"
          onAction={onAction}
        />
      );

      expect(getByText('No Files')).toBeTruthy();
      expect(getByText('Upload your first file to get started')).toBeTruthy();
      expect(getByText('Upload File')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty title', () => {
      const { getByText } = render(<EmptyState title="" />);
      expect(getByText('')).toBeTruthy();
    });

    it('should handle long description', () => {
      const longDesc = 'This is a very long description that explains in great detail why there are no items to display and what the user should do about it';
      const { getByText } = render(
        <EmptyState
          title="Empty"
          description={longDesc}
        />
      );
      expect(getByText(longDesc)).toBeTruthy();
    });

    it('should handle special characters in text', () => {
      const { getByText } = render(
        <EmptyState
          title="No <Items> Found!"
          description="Try again & search differently"
        />
      );
      expect(getByText('No <Items> Found!')).toBeTruthy();
      expect(getByText('Try again & search differently')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible', () => {
      const { getByText } = render(
        <EmptyState
          title="No Data"
          description="Description"
        />
      );
      expect(getByText('No Data')).toBeTruthy();
      expect(getByText('Description')).toBeTruthy();
    });
  });
});
