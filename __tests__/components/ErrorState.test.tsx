import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorState } from '@/components/ui/ErrorState';

describe('ErrorState Component', () => {
  it('should display error message and call retry callback', () => {
    const mockRetry = jest.fn();
    const { getByText } = render(
      <ErrorState
        type="network"
        onRetry={mockRetry}
        retryLabel="Try Again"
      />
    );

    // Should display error title and message
    expect(getByText('No Internet Connection')).toBeTruthy();
    expect(
      getByText('Please check your internet connection and try again.')
    ).toBeTruthy();

    // Should call retry when button is pressed
    const retryButton = getByText('Try Again');
    fireEvent.press(retryButton);

    expect(mockRetry).toHaveBeenCalled();
  });
});
