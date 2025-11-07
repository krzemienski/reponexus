import '@testing-library/jest-native/extend-expect';

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      EXPO_PUBLIC_API_URL: 'http://localhost:8000',
      EXPO_PUBLIC_WS_URL: 'ws://localhost:8000',
      EXPO_PUBLIC_GITHUB_CLIENT_ID: 'test_client_id',
    },
  },
}));

// Mock expo-auth-session
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'reponexus://callback'),
  AuthRequest: jest.fn(),
  generateRandom: jest.fn(() => 'random_state'),
  loadAsync: jest.fn(),
  promptAsync: jest.fn(),
}));

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openBrowserAsync: jest.fn(),
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-local-authentication
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([1])),
  getEnrolledLevelAsync: jest.fn(() => Promise.resolve(1)),
  authenticateAsync: jest.fn(() =>
    Promise.resolve({ success: true, error: null })
  ),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock expo-linking
jest.mock('expo-linking', () => ({
  createURL: jest.fn(() => 'reponexus://'),
  parse: jest.fn(),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  Stack: { Screen: 'Screen' },
  Tabs: { Screen: 'Screen' },
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock react-native-mmkv
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

// Set __DEV__ to false for tests
global.__DEV__ = false;
