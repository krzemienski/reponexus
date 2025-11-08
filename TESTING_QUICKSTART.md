# Testing Quick Start Guide

## 🚀 Running Tests

```bash
# Run all tests
npm test

# Watch mode (automatically reruns on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# CI mode (for continuous integration)
npm run test:ci
```

## 📊 What's Included

**32 Tests Across:**
- ✅ 6 tests for useAuth hook (login, logout, biometric)
- ✅ 6 tests for useRepositories hook (fetch, pagination, caching)
- ✅ 10 tests for UI components (cards, search, filters)
- ✅ 10 tests for app screens (login, explore, trending, etc.)

## 📁 Test Files Location

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

## 🔧 Configuration

- **jest.config.js** - Main configuration
- **jest.setup.js** - Test environment setup with mocks
- **TESTING.md** - Comprehensive testing guide
- **TEST_IMPLEMENTATION_SUMMARY.md** - Detailed implementation docs

## 📝 Example Test

```typescript
// __tests__/hooks/useAuth.test.ts
describe('useAuth Hook', () => {
  it('should successfully login with GitHub OAuth', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const success = await result.current.login();
      expect(success).toBe(true);
    });
  });
});
```

## 🛠️ Troubleshooting

### Clear Jest Cache
```bash
npx jest --clearCache
```

### Run Single Test File
```bash
npm test -- __tests__/hooks/useAuth.test.ts
```

### Verbose Output
```bash
npm test -- --verbose
```

## 📚 Full Documentation

For complete testing documentation, see:
- **TESTING.md** - Full testing guide with best practices
- **TEST_IMPLEMENTATION_SUMMARY.md** - Implementation details

## ✅ Verify Installation

Run the verification script:
```bash
./verify-tests.sh
```

Expected output:
- 12 test files
- 32 total tests
- All configuration files present

## 🎯 Coverage Goals

Current thresholds: 30% minimum
Target: 50%+ across all metrics

Run coverage to see current status:
```bash
npm run test:coverage
```

---

**Status**: ✅ Production Ready
**Framework**: Jest + React Testing Library
**Total Tests**: 32
