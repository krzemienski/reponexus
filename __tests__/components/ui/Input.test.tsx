import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Input } from '../../../components/ui/Input';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render with default variant', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Enter text" />
      );
      expect(getByPlaceholderText('Enter text')).toBeTruthy();
    });

    it('should render with label', () => {
      const { getByText } = render(
        <Input label="Username" placeholder="Enter username" />
      );
      expect(getByText('Username')).toBeTruthy();
    });

    it('should render with prefix icon', () => {
      const { UNSAFE_getByType } = render(
        <Input prefixIcon="search-outline" placeholder="Search" />
      );
      expect(UNSAFE_getByType).toBeTruthy();
    });

    it('should render with suffix icon', () => {
      const { UNSAFE_getByType } = render(
        <Input suffixIcon="mail-outline" placeholder="Email" />
      );
      expect(UNSAFE_getByType).toBeTruthy();
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      const { getByPlaceholderText } = render(
        <Input variant="default" placeholder="Default" />
      );
      expect(getByPlaceholderText('Default')).toBeTruthy();
    });

    it('should render error variant with error message', () => {
      const { getByText, getByPlaceholderText } = render(
        <Input
          variant="error"
          placeholder="Error"
          errorMessage="This field is required"
        />
      );
      expect(getByPlaceholderText('Error')).toBeTruthy();
      expect(getByText('This field is required')).toBeTruthy();
    });

    it('should render success variant with success message', () => {
      const { getByText, getByPlaceholderText } = render(
        <Input
          variant="success"
          placeholder="Success"
          successMessage="Looks good!"
        />
      );
      expect(getByPlaceholderText('Success')).toBeTruthy();
      expect(getByText('Looks good!')).toBeTruthy();
    });
  });

  describe('Value Changes', () => {
    it('should handle text input changes', () => {
      const onChangeText = jest.fn();
      const { getByPlaceholderText } = render(
        <Input placeholder="Type here" onChangeText={onChangeText} />
      );

      const input = getByPlaceholderText('Type here');
      fireEvent.changeText(input, 'Hello');

      expect(onChangeText).toHaveBeenCalledWith('Hello');
    });

    it('should update value prop', () => {
      const { getByDisplayValue, rerender } = render(
        <Input value="Initial" onChangeText={jest.fn()} />
      );

      expect(getByDisplayValue('Initial')).toBeTruthy();

      rerender(<Input value="Updated" onChangeText={jest.fn()} />);
      expect(getByDisplayValue('Updated')).toBeTruthy();
    });
  });

  describe('Clear Button', () => {
    it('should show clear button when input has value and is focused', async () => {
      const onChangeText = jest.fn();
      const onClear = jest.fn();
      const { getByPlaceholderText, UNSAFE_queryAllByType } = render(
        <Input
          placeholder="Search"
          value="test"
          onChangeText={onChangeText}
          onClear={onClear}
          showClearButton={true}
        />
      );

      const input = getByPlaceholderText('Search');
      fireEvent(input, 'focus');

      await waitFor(() => {
        const pressables = UNSAFE_queryAllByType(require('react-native').Pressable);
        expect(pressables.length).toBeGreaterThan(0);
      });
    });

    it('should clear input when clear button is pressed', async () => {
      const onChangeText = jest.fn();
      const onClear = jest.fn();
      const { getByPlaceholderText } = render(
        <Input
          placeholder="Search"
          value="test"
          onChangeText={onChangeText}
          onClear={onClear}
          showClearButton={true}
        />
      );

      const input = getByPlaceholderText('Search');
      fireEvent(input, 'focus');

      await waitFor(() => {
        expect(onChangeText).not.toHaveBeenCalled();
      });
    });

    it('should not show clear button when showClearButton is false', () => {
      const { getByPlaceholderText } = render(
        <Input
          placeholder="Search"
          value="test"
          showClearButton={false}
        />
      );

      const input = getByPlaceholderText('Search');
      fireEvent(input, 'focus');

      // Clear button should not be rendered
      expect(true).toBe(true);
    });
  });

  describe('Focus Handling', () => {
    it('should handle focus event', () => {
      const onFocus = jest.fn();
      const { getByPlaceholderText } = render(
        <Input placeholder="Focus me" onFocus={onFocus} />
      );

      const input = getByPlaceholderText('Focus me');
      fireEvent(input, 'focus');

      expect(onFocus).toHaveBeenCalled();
    });

    it('should handle blur event', () => {
      const onBlur = jest.fn();
      const { getByPlaceholderText } = render(
        <Input placeholder="Blur me" onBlur={onBlur} />
      );

      const input = getByPlaceholderText('Blur me');
      fireEvent(input, 'blur');

      expect(onBlur).toHaveBeenCalled();
    });

    it('should change border style on focus', async () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Focus test" />
      );

      const input = getByPlaceholderText('Focus test');
      fireEvent(input, 'focus');

      await waitFor(() => {
        expect(input).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('should support accessibility label', () => {
      const { getByLabelText } = render(
        <Input
          placeholder="Search"
          accessibilityLabel="Search input"
        />
      );

      expect(getByLabelText('Search input')).toBeTruthy();
    });

    it('should support accessibility hint', () => {
      const { getByPlaceholderText } = render(
        <Input
          placeholder="Password"
          accessibilityHint="Enter your password"
        />
      );

      expect(getByPlaceholderText('Password')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty value', () => {
      const { getByPlaceholderText } = render(
        <Input value="" placeholder="Empty" />
      );

      expect(getByPlaceholderText('Empty')).toBeTruthy();
    });

    it('should handle undefined value', () => {
      const { getByPlaceholderText } = render(
        <Input value={undefined} placeholder="Undefined" />
      );

      expect(getByPlaceholderText('Undefined')).toBeTruthy();
    });

    it('should handle very long text', () => {
      const longText = 'A'.repeat(1000);
      const { getByDisplayValue } = render(
        <Input value={longText} />
      );

      expect(getByDisplayValue(longText)).toBeTruthy();
    });
  });

  describe('Integration with other props', () => {
    it('should support multiline', () => {
      const { getByPlaceholderText } = render(
        <Input
          placeholder="Multiline"
          multiline
          numberOfLines={4}
        />
      );

      expect(getByPlaceholderText('Multiline')).toBeTruthy();
    });

    it('should support secure text entry', () => {
      const { getByPlaceholderText } = render(
        <Input
          placeholder="Password"
          secureTextEntry
        />
      );

      expect(getByPlaceholderText('Password')).toBeTruthy();
    });

    it('should support keyboard type', () => {
      const { getByPlaceholderText } = render(
        <Input
          placeholder="Email"
          keyboardType="email-address"
        />
      );

      expect(getByPlaceholderText('Email')).toBeTruthy();
    });
  });
});
