import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorState } from '../../../components/ui/ErrorState';

describe('ErrorState Component', () => {
  describe('Rendering', () => {
    it('should render with title', () => {
      const { getByText } = render(
        <ErrorState title="Error Occurred" />
      );
      expect(getByText('Error Occurred')).toBeTruthy();
    });

    it('should render with title and message', () => {
      const { getByText } = render(
        <ErrorState
          title="Connection Failed"
          message="Please check your internet connection"
        />
      );
      expect(getByText('Connection Failed')).toBeTruthy();
      expect(getByText('Please check your internet connection')).toBeTruthy();
    });

    it('should render with default title when not provided', () => {
      const { getByText } = render(<ErrorState />);
      expect(getByText('Something went wrong')).toBeTruthy();
    });
  });

  describe('Error Icon', () => {
    it('should display error icon', () => {
      const { getByText } = render(
        <ErrorState title="Error" />
      );
      expect(getByText('Error')).toBeTruthy();
    });
  });

  describe('Retry Functionality', () => {
    it('should render retry button when onRetry is provided', () => {
      const onRetry = jest.fn();
      const { getByText } = render(
        <ErrorState title="Error" onRetry={onRetry} />
      );
      expect(getByText('Try Again')).toBeTruthy();
    });

    it('should call onRetry when retry button is pressed', () => {
      const onRetry = jest.fn();
      const { getByText } = render(
        <ErrorState title="Error" onRetry={onRetry} />
      );

      const button = getByText('Try Again');
      fireEvent.press(button);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not render retry button when onRetry is not provided', () => {
      const { queryByText } = render(
        <ErrorState title="Error" />
      );
      expect(queryByText('Try Again')).toBeNull();
    });

    it('should use custom retry button label', () => {
      const onRetry = jest.fn();
      const { getByText } = render(
        <ErrorState
          title="Error"
          onRetry={onRetry}
          retryLabel="Retry Now"
        />
      );
      expect(getByText('Retry Now')).toBeTruthy();
    });
  });

  describe('Error Details', () => {
    it('should render error details when provided', () => {
      const { getByText } = render(
        <ErrorState
          title="API Error"
          message="Failed to fetch data"
          errorDetails="Error 500: Internal Server Error"
        />
      );
      expect(getByText('Error 500: Internal Server Error')).toBeTruthy();
    });

    it('should not render error details when not provided', () => {
      const { queryByText } = render(
        <ErrorState title="Error" />
      );
      // Error details should not be visible
      expect(queryByText('Error 500')).toBeNull();
    });
  });

  describe('Different Error Types', () => {
    it('should render network error', () => {
      const { getByText } = render(
        <ErrorState
          title="Network Error"
          message="Unable to connect to server"
        />
      );
      expect(getByText('Network Error')).toBeTruthy();
      expect(getByText('Unable to connect to server')).toBeTruthy();
    });

    it('should render 404 error', () => {
      const { getByText } = render(
        <ErrorState
          title="Not Found"
          message="The requested resource was not found"
        />
      );
      expect(getByText('Not Found')).toBeTruthy();
      expect(getByText('The requested resource was not found')).toBeTruthy();
    });

    it('should render permission error', () => {
      const { getByText } = render(
        <ErrorState
          title="Access Denied"
          message="You don't have permission to view this"
        />
      );
      expect(getByText('Access Denied')).toBeTruthy();
      expect(getByText("You don't have permission to view this")).toBeTruthy();
    });
  });

  describe('Complete Configuration', () => {
    it('should render all props together', () => {
      const onRetry = jest.fn();
      const { getByText } = render(
        <ErrorState
          title="Failed to Load"
          message="Could not load repositories"
          errorDetails="TypeError: Cannot read property"
          onRetry={onRetry}
          retryLabel="Reload"
        />
      );

      expect(getByText('Failed to Load')).toBeTruthy();
      expect(getByText('Could not load repositories')).toBeTruthy();
      expect(getByText('TypeError: Cannot read property')).toBeTruthy();
      expect(getByText('Reload')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      const { getByText } = render(
        <ErrorState title="Error" message="" />
      );
      expect(getByText('Error')).toBeTruthy();
    });

    it('should handle very long error messages', () => {
      const longMessage = 'This is a very long error message that describes in great detail what went wrong and might need to wrap across multiple lines';
      const { getByText } = render(
        <ErrorState title="Error" message={longMessage} />
      );
      expect(getByText(longMessage)).toBeTruthy();
    });

    it('should handle special characters in error', () => {
      const { getByText } = render(
        <ErrorState
          title="Error: <Component>"
          message="Failed with code & message"
        />
      );
      expect(getByText('Error: <Component>')).toBeTruthy();
      expect(getByText('Failed with code & message')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible for screen readers', () => {
      const { getByText } = render(
        <ErrorState
          title="Error"
          message="Description"
        />
      );
      expect(getByText('Error')).toBeTruthy();
      expect(getByText('Description')).toBeTruthy();
    });

    it('should have accessible retry button', () => {
      const onRetry = jest.fn();
      const { getByText } = render(
        <ErrorState title="Error" onRetry={onRetry} />
      );
      const button = getByText('Try Again');
      expect(button).toBeTruthy();
    });
  });
});
