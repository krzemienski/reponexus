import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FilterSheet } from '@/components/features/search/FilterSheet';

describe('FilterSheet Component', () => {
  const mockOnClose = jest.fn();
  const mockOnApply = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnApply.mockClear();
  });

  it('should apply filters when Apply button is pressed', () => {
    const { getByText } = render(
      <FilterSheet
        visible={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    );

    // Click on a language filter
    const typeScriptButton = getByText('TypeScript');
    fireEvent.press(typeScriptButton);

    // Click Apply button
    const applyButton = getByText('Apply Filters');
    fireEvent.press(applyButton);

    expect(mockOnApply).toHaveBeenCalledWith(
      expect.objectContaining({
        language: 'TypeScript',
      })
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should reset filters when Reset button is pressed', () => {
    const initialFilters = {
      language: 'TypeScript',
      minStars: 100,
    };

    const { getByText, rerender } = render(
      <FilterSheet
        visible={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
        initialFilters={initialFilters}
      />
    );

    // Click Reset button
    const resetButton = getByText('Reset');
    fireEvent.press(resetButton);

    // After reset, clicking apply should send empty filters
    const applyButton = getByText('Apply Filters');
    fireEvent.press(applyButton);

    expect(mockOnApply).toHaveBeenCalledWith({
      language: undefined,
      minStars: undefined,
      maxStars: undefined,
      minForks: undefined,
    });
  });
});
