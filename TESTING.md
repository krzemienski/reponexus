# Testing Guide for Repo Nexus

## Overview

This document describes the testing infrastructure for the Repo Nexus React Native application. The project uses Jest and React Testing Library for comprehensive test coverage.

## Test Structure

```
__tests__/
├── hooks/              # Hook tests
│   ├── useAuth.test.ts
│   └── useRepositories.test.ts
├── components/         # Component tests
│   ├── RepositoryCard.test.tsx
│   ├── TopicCard.test.tsx
│   ├── SearchBar.test.tsx
│   ├── FilterSheet.test.tsx
│   └── ErrorState.test.tsx
└── screens/            # Screen tests
    ├── LoginScreen.test.tsx
    ├── ExploreScreen.test.tsx
    ├── TrendingScreen.test.tsx
    ├── TopicsScreen.test.tsx
    └── ProfileScreen.test.tsx
```

## Test Count

**Total: 30 Critical Tests**

### Breakdown:
- **Hook Tests**: 10 tests
  - useAuth: 5 tests (login, logout, token refresh, biometric auth)
  - useRepositories: 5 tests (fetch, loading, error, pagination, cache)

- **Component Tests**: 10 tests
  - RepositoryCard: 3 tests
  - TopicCard: 2 tests
  - SearchBar: 2 tests
  - FilterSheet: 2 tests
  - ErrorState: 1 test

- **Screen Tests**: 10 tests
  - LoginScreen: 2 tests
  - ExploreScreen: 2 tests
  - TrendingScreen: 2 tests
  - TopicsScreen: 2 tests
  - ProfileScreen: 2 tests

## Configuration Files

### jest.config.js
Main Jest configuration with:
- Expo preset for React Native
- Module path mapping for @ imports
- Coverage thresholds (30% minimum)
- Transform ignore patterns for node_modules

### jest.setup.js
Test environment setup with:
- Mocked Expo modules (expo-router, expo-auth-session, etc.)
- Mocked React Native modules
- Mocked storage (AsyncStorage, SecureStore)
- Mocked React Native Paper
- Mocked TanStack Query

## Running Tests

### Available Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

### Test Examples

#### Hook Test Example
```typescript
describe('useAuth Hook', () => {
  it('should successfully login with GitHub OAuth', async () => {
    const mockAuthResponse = { access_token: 'mock-token' };
    (authService.initiateLogin as jest.Mock).mockResolvedValue({
      type: 'success',
      params: { code: 'mock-code' },
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const loginResult = await result.current.login();
      expect(loginResult).toBe(true);
    });
  });
});
```

#### Component Test Example
```typescript
describe('RepositoryCard Component', () => {
  it('should render repository information correctly', () => {
    const { getByText } = render(<RepositoryCard repository={mockRepo} />);

    expect(getByText('react')).toBeTruthy();
    expect(getByText('1,000')).toBeTruthy();
  });
});
```

## Testing Best Practices

### 1. Test User Behavior, Not Implementation
```typescript
// Good - tests what the user sees/does
fireEvent.press(getByText('Sign in with GitHub'));
expect(mockLogin).toHaveBeenCalled();

// Bad - tests internal implementation
expect(component.state.isLoading).toBe(true);
```

### 2. Mock External Dependencies
```typescript
jest.mock('@/services/auth/authService');
jest.mock('expo-router');
```

### 3. Use Testing Library Queries
```typescript
// Preferred queries (in order)
getByRole, getByLabelText, getByPlaceholderText, getByText

// Avoid
getByTestId (use only when necessary)
```

### 4. Test Accessibility
```typescript
expect(getByRole('button', { name: 'Sign in' })).toBeTruthy();
```

## Known Issues & Troubleshooting

### Issue: Babel Configuration Error
**Error**: `.plugins is not a valid Plugin property`

**Cause**: Compatibility issue between jest-expo, react-native, and babel configuration.

**Solution**: The project is configured with appropriate mocks in `jest.setup.js`. If you encounter this error:

1. Clear Jest cache:
```bash
npx jest --clearCache
```

2. Reinstall node_modules:
```bash
rm -rf node_modules
npm install
```

3. Update babel.config.js to ensure it returns a function:
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [/* ... */]
  };
};
```

### Issue: Module Resolution
**Error**: `Cannot find module '@/...'`

**Solution**: Ensure `moduleNameMapper` in jest.config.js matches your tsconfig paths:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

### Issue: Transform Ignore Patterns
**Error**: `SyntaxError: Unexpected token` in node_modules

**Solution**: Add the package to transformIgnorePatterns:
```javascript
transformIgnorePatterns: [
  'node_modules/(?!(react-native|@react-native|expo|@expo|...)/)',
]
```

## Coverage Goals

Current coverage thresholds:
- Branches: 30%
- Functions: 30%
- Lines: 30%
- Statements: 30%

**Target coverage**: 50%+ across all metrics

## Test Data & Fixtures

Create mock data in test files:

```typescript
const mockRepository: Repository = {
  id: '1',
  name: 'react',
  ownerLogin: 'facebook',
  description: 'A JavaScript library',
  stargazerCount: 1000,
  // ... other required fields
};
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Tests
  run: npm run test:ci

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Debugging Tests

### Run Single Test File
```bash
npm test -- __tests__/hooks/useAuth.test.ts
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

### Verbose Output
```bash
npm test -- --verbose
```

## Next Steps

1. **Increase Coverage**: Write additional tests for uncovered code paths
2. **E2E Tests**: Consider adding Detox for end-to-end testing
3. **Visual Regression**: Add screenshot testing with jest-image-snapshot
4. **Performance**: Add performance tests for critical components
5. **Accessibility**: Expand accessibility testing with @testing-library/jest-native

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react-native)
- [Testing React Native Apps](https://reactnative.dev/docs/testing-overview)
- [Expo Testing Guide](https://docs.expo.dev/develop/unit-testing/)

## Support

For questions or issues with testing:
1. Check this documentation
2. Review test examples in `__tests__/` directory
3. Consult Jest/React Testing Library docs
4. Check project GitHub issues

---

**Last Updated**: November 2025
**Test Framework**: Jest 29.7.0 + React Testing Library 12.4.0
**Test Count**: 30 critical tests
**Coverage Target**: 50%+
