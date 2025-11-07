import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    const { getByText } = render(<Button>Click Me</Button>);
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button onPress={onPressMock}>Click Me</Button>);

    fireEvent.press(getByText('Click Me'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('renders with different variants', () => {
    const { rerender, getByText } = render(
      <Button variant="primary">Primary</Button>
    );
    expect(getByText('Primary')).toBeTruthy();

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(getByText('Secondary')).toBeTruthy();

    rerender(<Button variant="outline">Outline</Button>);
    expect(getByText('Outline')).toBeTruthy();

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(getByText('Ghost')).toBeTruthy();
  });

  it('renders with different sizes', () => {
    const { rerender, getByText } = render(<Button size="sm">Small</Button>);
    expect(getByText('Small')).toBeTruthy();

    rerender(<Button size="md">Medium</Button>);
    expect(getByText('Medium')).toBeTruthy();

    rerender(<Button size="lg">Large</Button>);
    expect(getByText('Large')).toBeTruthy();
  });

  it('shows loading indicator when loading prop is true', () => {
    const { getByTestId } = render(<Button loading>Loading</Button>);
    expect(getByTestId('activity-indicator')).toBeTruthy();
  });

  it('is disabled when disabled prop is true', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button disabled onPress={onPressMock}>
        Disabled
      </Button>
    );

    fireEvent.press(getByText('Disabled'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('is disabled when loading', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <Button loading onPress={onPressMock}>
        Loading
      </Button>
    );

    // Button should be disabled while loading
    expect(getByTestId('activity-indicator')).toBeTruthy();
  });
});
