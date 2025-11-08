import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '@/app/(auth)/login';

// Mock useAuth hook
const mockLogin = jest.fn();
const mockLoginWithBiometric = jest.fn();
const mockIsBiometricAvailable = jest.fn();
const mockIsBiometricEnabled = jest.fn();

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    loginWithBiometric: mockLoginWithBiometric,
    isLoading: false,
    error: null,
    isAuthenticated: false,
    isBiometricAvailable: mockIsBiometricAvailable,
    isBiometricEnabled: mockIsBiometricEnabled,
  }),
}));

// Mock expo-router
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    back: jest.fn(),
  }),
}));

// Mock expo-haptics
jest.mock('expo-haptics');

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsBiometricAvailable.mockResolvedValue(false);
    mockIsBiometricEnabled.mockResolvedValue(false);
  });

  it('should render login button', () => {
    const { getByText } = render(<LoginScreen />);

    expect(getByText('Repo Nexus')).toBeTruthy();
    expect(getByText('Sign in with GitHub')).toBeTruthy();
  });

  it('should initiate OAuth flow when login button is pressed', async () => {
    mockLogin.mockResolvedValue(true);

    const { getByText } = render(<LoginScreen />);

    const loginButton = getByText('Sign in with GitHub');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
  });
});
