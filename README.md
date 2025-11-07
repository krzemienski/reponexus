# Repo Nexus

A modern iOS application built with React Native and Expo that provides an enhanced GitHub exploration experience.

## Features

- 🔐 OAuth 2.0 Authentication with GitHub
- 🔍 Advanced Search across repositories and topics
- 📈 Trending Analysis with real-time updates
- 🏷️ Topic Management for personalized discovery
- 💾 Offline Support with local caching
- 🔔 Push Notifications for updates
- 📊 Analytics Dashboard for repository insights

## Tech Stack

### Frontend
- **Framework**: React Native 0.75 + Expo ~52.0
- **Routing**: Expo Router ~4.0
- **Styling**: NativeWind v5 (Tailwind CSS for React Native)
- **Animations**: React Native Reanimated v4
- **State Management**: Zustand + TanStack Query
- **Storage**: MMKV + Expo Secure Store
- **Language**: TypeScript

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL + Redis
- **ORM**: SQLAlchemy
- **Task Queue**: Celery
- **API**: REST + GraphQL

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- iOS 17.0+ (for running on device)
- Xcode (for iOS development)
- Python 3.12+ (for backend)
- PostgreSQL 16+
- Redis 7+

## Getting Started

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update environment variables in `.env`

4. Start the development server:
```bash
npm start
```

5. Run on iOS:
```bash
npm run ios
```

### Backend Setup

See `/backend/README.md` for backend setup instructions.

## Project Structure

```
repo-nexus/
├── app/                    # Expo Router app directory
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab screens
│   ├── repository/        # Repository detail screens
│   ├── topic/             # Topic detail screens
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── ui/               # UI components
│   ├── features/         # Feature-specific components
│   └── shared/           # Shared components
├── services/             # API and services
│   ├── api/             # API client
│   ├── auth/            # Authentication service
│   └── storage/         # Storage utilities
├── hooks/               # Custom React hooks
├── stores/              # Zustand stores
├── utils/               # Utility functions
├── types/               # TypeScript types
└── backend/             # Python backend (separate)
```

## Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- RepositoryCard.test.tsx
```

## Building for Production

### EAS Build

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Build for iOS:
```bash
eas build --profile production --platform ios
```

4. Submit to App Store:
```bash
eas submit --platform ios --latest
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Expo](https://expo.dev/)
- Styled with [NativeWind](https://www.nativewind.dev/)
- Powered by [GitHub API](https://docs.github.com/en/rest)

## Version

Current version: 1.0.0

## Status

🚧 **In Development**

---

**Last Updated**: November 7, 2025
