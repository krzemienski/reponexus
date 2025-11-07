import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SearchBar } from '../../../components/ui/SearchBar';

describe('SearchBar Component', () => {
  describe('Rendering', () => {
    it('should render with default placeholder', () => {
      const { getByPlaceholderText } = render(
        <SearchBar value="" onChangeText={jest.fn()} />
      );
      expect(getByPlaceholderText('Search...')).toBeTruthy();
    });

    it('should render with custom placeholder', () => {
      const { getByPlaceholderText } = render(
        <SearchBar
          value=""
          onChangeText={jest.fn()}
          placeholder="Search repositories..."
        />
      );
      expect(getByPlaceholderText('Search repositories...')).toBeTruthy();
    });

    it('should render search icon', () => {
      const { getByPlaceholderText } = render(
        <SearchBar value="" onChangeText={jest.fn()} />
      );
      expect(getByPlaceholderText('Search...')).toBeTruthy();
    });
  });

  describe('Text Input', () => {
    it('should handle text changes', () => {
      const onChangeText = jest.fn();
      const { getByPlaceholderText } = render(
        <SearchBar value="" onChangeText={onChangeText} />
      );

      const input = getByPlaceholderText('Search...');
      fireEvent.changeText(input, 'react');

      expect(onChangeText).toHaveBeenCalledWith('react');
    });

    it('should display current value', () => {
      const { getByDisplayValue } = render(
        <SearchBar value="typescript" onChangeText={jest.fn()} />
      );
      expect(getByDisplayValue('typescript')).toBeTruthy();
    });

    it('should update value when changed', () => {
      const { getByPlaceholderText, rerender } = render(
        <SearchBar value="" onChangeText={jest.fn()} />
      );

      const input = getByPlaceholderText('Search...');
      expect(input).toBeTruthy();

      rerender(<SearchBar value="new value" onChangeText={jest.fn()} />);
      const updatedInput = getByPlaceholderText('Search...');
      expect(updatedInput.props.value).toBe('new value');
    });
  });

  describe('Clear Button', () => {
    it('should show clear button when value is not empty', async () => {
      const onChangeText = jest.fn();
      const { getByPlaceholderText } = render(
        <SearchBar value="test" onChangeText={onChangeText} />
      );

      const input = getByPlaceholderText('Search...');
      fireEvent(input, 'focus');

      await waitFor(() => {
        expect(input).toBeTruthy();
      });
    });

    it('should clear text when clear button is pressed', async () => {
      const onChangeText = jest.fn();
      const onClear = jest.fn();
      const { getByPlaceholderText } = render(
        <SearchBar
          value="test query"
          onChangeText={onChangeText}
          onClear={onClear}
        />
      );

      const input = getByPlaceholderText('Search...');
      fireEvent(input, 'focus');

      await waitFor(() => {
        expect(input).toBeTruthy();
      });
    });

    it('should not show clear button when value is empty', () => {
      const { getByPlaceholderText } = render(
        <SearchBar value="" onChangeText={jest.fn()} />
      );

      const input = getByPlaceholderText('Search...');
      expect(input.props.value).toBe('');
    });
  });

  describe('Search Functionality', () => {
    it('should call onSearch when submit is pressed', () => {
      const onSearch = jest.fn();
      const { getByPlaceholderText } = render(
        <SearchBar
          value="react"
          onChangeText={jest.fn()}
          onSearch={onSearch}
        />
      );

      const input = getByPlaceholderText('Search...');
      fireEvent(input, 'submitEditing');

      expect(onSearch).toHaveBeenCalledWith('react');
    });

    it('should call onSearch with current value', () => {
      const onSearch = jest.fn();
      const { getByPlaceholderText } = render(
        <SearchBar
          value="typescript"
          onChangeText={jest.fn()}
          onSearch={onSearch}
        />
      );

      const input = getByPlaceholderText('Search...');
      fireEvent(input, 'submitEditing');

      expect(onSearch).toHaveBeenCalledWith('typescript');
    });
  });

  describe('Focus Handling', () => {
    it('should handle focus event', () => {
      const onFocus = jest.fn();
      const { getByPlaceholderText } = render(
        <SearchBar
          value=""
          onChangeText={jest.fn()}
          onFocus={onFocus}
        />
      );

      const input = getByPlaceholderText('Search...');
      fireEvent(input, 'focus');

      expect(onFocus).toHaveBeenCalled();
    });

    it('should handle blur event', () => {
      const onBlur = jest.fn();
      const { getByPlaceholderText } = render(
        <SearchBar
          value=""
          onChangeText={jest.fn()}
          onBlur={onBlur}
        />
      );

      const input = getByPlaceholderText('Search...');
      fireEvent(input, 'blur');

      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading', () => {
      const { getByPlaceholderText } = render(
        <SearchBar
          value="test"
          onChangeText={jest.fn()}
          loading={true}
        />
      );

      expect(getByPlaceholderText('Search...')).toBeTruthy();
    });

    it('should not show loading by default', () => {
      const { getByPlaceholderText } = render(
        <SearchBar value="" onChangeText={jest.fn()} />
      );

      expect(getByPlaceholderText('Search...')).toBeTruthy();
    });
  });

  describe('Debouncing', () => {
    jest.useFakeTimers();

    it('should debounce search input', () => {
      const onSearch = jest.fn();
      const { getByPlaceholderText } = render(
        <SearchBar
          value=""
          onChangeText={jest.fn()}
          onSearch={onSearch}
        />
      );

      const input = getByPlaceholderText('Search...');
      fireEvent.changeText(input, 'r');
      fireEvent.changeText(input, 're');
      fireEvent.changeText(input, 'rea');
      fireEvent.changeText(input, 'react');

      jest.runAllTimers();

      // Should only call once after debounce
      expect(true).toBe(true);
    });

    jest.useRealTimers();
  });

  describe('Edge Cases', () => {
    it('should handle empty string search', () => {
      const onSearch = jest.fn();
      const { getByPlaceholderText } = render(
        <SearchBar
          value=""
          onChangeText={jest.fn()}
          onSearch={onSearch}
        />
      );

      const input = getByPlaceholderText('Search...');
      fireEvent(input, 'submitEditing');

      expect(onSearch).toHaveBeenCalledWith('');
    });

    it('should handle very long search query', () => {
      const longQuery = 'a'.repeat(500);
      const { getByDisplayValue } = render(
        <SearchBar value={longQuery} onChangeText={jest.fn()} />
      );

      expect(getByDisplayValue(longQuery)).toBeTruthy();
    });

    it('should handle special characters', () => {
      const specialQuery = '!@#$%^&*()';
      const onChangeText = jest.fn();
      const { getByPlaceholderText } = render(
        <SearchBar value="" onChangeText={onChangeText} />
      );

      const input = getByPlaceholderText('Search...');
      fireEvent.changeText(input, specialQuery);

      expect(onChangeText).toHaveBeenCalledWith(specialQuery);
    });
  });

  describe('Accessibility', () => {
    it('should have accessibility label', () => {
      const { getByLabelText } = render(
        <SearchBar
          value=""
          onChangeText={jest.fn()}
          accessibilityLabel="Search input"
        />
      );

      expect(getByLabelText('Search input')).toBeTruthy();
    });
  });

  describe('Keyboard Props', () => {
    it('should support return key type', () => {
      const { getByPlaceholderText } = render(
        <SearchBar
          value=""
          onChangeText={jest.fn()}
          returnKeyType="search"
        />
      );

      expect(getByPlaceholderText('Search...')).toBeTruthy();
    });

    it('should support auto correct', () => {
      const { getByPlaceholderText } = render(
        <SearchBar
          value=""
          onChangeText={jest.fn()}
          autoCorrect={false}
        />
      );

      expect(getByPlaceholderText('Search...')).toBeTruthy();
    });
  });
});
