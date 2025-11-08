import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SearchBar } from '@/components/ui/SearchBar';

describe('SearchBar Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should handle input changes with debounce', async () => {
    const mockOnChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <SearchBar
        value=""
        onChangeText={mockOnChangeText}
        placeholder="Search repositories..."
      />
    );

    const input = getByPlaceholderText('Search repositories...');
    fireEvent.changeText(input, 'react');

    // Should not call immediately
    expect(mockOnChangeText).not.toHaveBeenCalled();

    // Fast-forward time past debounce period (300ms default)
    jest.advanceTimersByTime(300);

    // Should call after debounce
    await waitFor(() => {
      expect(mockOnChangeText).toHaveBeenCalledWith('react');
    });
  });

  it('should clear input when clear button is pressed', () => {
    const mockOnChangeText = jest.fn();
    const mockOnClear = jest.fn();
    const { getByPlaceholderText, rerender } = render(
      <SearchBar
        value="test"
        onChangeText={mockOnChangeText}
        onClear={mockOnClear}
        placeholder="Search..."
      />
    );

    // Find and click clear button (Pressable with close-circle icon)
    const { UNSAFE_getAllByType } = render(
      <SearchBar
        value="test"
        onChangeText={mockOnChangeText}
        onClear={mockOnClear}
        placeholder="Search..."
      />
    );

    const pressables = UNSAFE_getAllByType(
      require('react-native').Pressable
    );

    // The clear button should be present when there's text
    expect(pressables.length).toBeGreaterThan(0);

    // Simulate clear button press
    fireEvent.press(pressables[0]);

    expect(mockOnChangeText).toHaveBeenCalledWith('');
    expect(mockOnClear).toHaveBeenCalled();
  });
});
