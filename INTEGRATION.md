# Frontend-Backend Integration Guide

This guide explains how to integrate the React Native frontend with the FastAPI backend for full-stack development and testing.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Environment Configuration](#environment-configuration)
5. [Running the Full Stack](#running-the-full-stack)
6. [Authentication Flow](#authentication-flow)
7. [API Endpoints](#api-endpoints)
8. [Testing Integration](#testing-integration)
9. [Troubleshooting](#troubleshooting)
10. [Common Issues](#common-issues)

## Overview

The Repo Nexus application consists of:
- **Frontend**: React Native + Expo with TanStack Query
- **Backend**: FastAPI with PostgreSQL and Redis
- **Authentication**: GitHub OAuth 2.0 with JWT tokens

## Prerequisites

### Backend
- Python 3.12+
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose (recommended)

### Frontend
- Node.js 20+
- npm 10+
- Expo CLI
- iOS Simulator (macOS) or Android Emulator

## Quick Start

### 1. Start Backend Services

**Option A: Using Docker (Recommended)**
```bash
cd backend
docker-compose up -d
```

**Option B: Local Development**
```bash
# Start PostgreSQL and Redis
docker-compose up postgres redis -d

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Configure Frontend Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Minimum required:
# - EXPO_PUBLIC_API_URL
# - EXPO_PUBLIC_GITHUB_CLIENT_ID
```

### 3. Start Frontend

```bash
# Install dependencies
npm install

# Start Expo dev server
npm start

# Press 'i' for iOS or 'a' for Android
```

## Environment Configuration

### Platform-Specific URLs

The app automatically handles platform-specific URLs:

| Platform | URL | Example |
|----------|-----|---------|
| iOS Simulator | `http://localhost:8000` | Default |
| Android Emulator | `http://10.0.2.2:8000` | Auto-converted |
| Physical Device | `http://<YOUR_IP>:8000` | Use your local IP |
| Production | `https://api.reponexus.com` | Production URL |

### Finding Your Local IP

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```cmd
ipconfig | findstr IPv4
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_WS_URL=ws://localhost:8000
EXPO_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id_here
```

## Running the Full Stack

### Step-by-Step Process

1. **Start Backend**
   ```bash
   cd backend
   docker-compose up -d
   # Wait for services to be healthy
   docker-compose ps
   ```

2. **Verify Backend**
   ```bash
   # Check health endpoint
   curl http://localhost:8000/health
   
   # Should return:
   # {"status":"ok","database":"connected","redis":"connected"}
   ```

3. **Start Frontend**
   ```bash
   cd ..  # Back to root
   npm start
   ```

4. **Choose Platform**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code for physical device

## Authentication Flow

### GitHub OAuth Setup

1. **Create GitHub OAuth App**
   - Go to: https://github.com/settings/developers
   - Click "New OAuth App"
   - Fill in:
     - Application name: `Repo Nexus Dev`
     - Homepage URL: `http://localhost:8081`
     - Authorization callback URL: `reponexus://callback`
   - Copy the Client ID

2. **Configure Backend**
   ```bash
   # In backend/.env
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

3. **Configure Frontend**
   ```bash
   # In .env
   EXPO_PUBLIC_GITHUB_CLIENT_ID=your_client_id
   ```

### Authentication Flow Diagram

```
┌─────────┐          ┌──────────┐          ┌─────────┐          ┌────────┐
│  User   │          │ Frontend │          │ Backend │          │ GitHub │
└────┬────┘          └────┬─────┘          └────┬────┘          └───┬────┘
     │                    │                     │                    │
     │  1. Tap Login      │                     │                    │
     ├───────────────────>│                     │                    │
     │                    │                     │                    │
     │                    │  2. Open GitHub OAuth                    │
     │                    ├─────────────────────────────────────────>│
     │                    │                     │                    │
     │  3. Authorize App  │                     │                    │
     ├───────────────────────────────────────────────────────────────>│
     │                    │                     │                    │
     │                    │  4. Redirect with code                   │
     │                    │<─────────────────────────────────────────┤
     │                    │                     │                    │
     │                    │  5. Exchange code   │                    │
     │                    ├────────────────────>│                    │
     │                    │                     │                    │
     │                    │                     │  6. Validate code  │
     │                    │                     ├───────────────────>│
     │                    │                     │                    │
     │                    │                     │  7. User data      │
     │                    │                     │<───────────────────┤
     │                    │                     │                    │
     │                    │  8. JWT tokens      │                    │
     │                    │<────────────────────┤                    │
     │                    │                     │                    │
     │  9. Success        │                     │                    │
     │<───────────────────┤                     │                    │
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Initiate OAuth login
- `POST /api/v1/auth/callback` - Handle OAuth callback
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user

### Repositories
- `GET /api/v1/repositories` - List repositories
  - Query params: `page`, `perPage`, `sort`, `language`, `topic`
- `GET /api/v1/repositories/trending` - Get trending repos
  - Query params: `period` (daily|weekly|monthly), `language`
- `GET /api/v1/repositories/{id}` - Get single repository
- `GET /api/v1/repositories/{id}/readme` - Get repository README
- `PUT /api/v1/repositories/{id}/star` - Star repository
- `DELETE /api/v1/repositories/{id}/star` - Unstar repository

### Topics
- `GET /api/v1/topics` - List topics
  - Query params: `page`, `perPage`, `sort`
- `GET /api/v1/topics/{name}` - Get topic by name
- `GET /api/v1/topics/{name}/repositories` - Get topic repositories
- `POST /api/v1/topics/{name}/follow` - Follow topic
- `DELETE /api/v1/topics/{name}/follow` - Unfollow topic

### Users
- `GET /api/v1/users/me` - Get current user profile
- `PATCH /api/v1/users/me` - Update user profile
- `GET /api/v1/users/me/starred` - Get starred repositories
- `GET /api/v1/users/me/topics` - Get followed topics
- `GET /api/v1/users/{login}` - Get user by login

### Search
- `GET /api/v1/search/repositories` - Search repositories
  - Query params: `q` (required), `sort`, `order`, `page`, `perPage`
- `GET /api/v1/search/topics` - Search topics
  - Query params: `q` (required), `sort`, `order`, `page`, `perPage`
- `GET /api/v1/search/users` - Search users
  - Query params: `q` (required), `sort`, `order`, `page`, `perPage`

## Testing Integration

### Manual Testing Checklist

#### 1. Backend Health Check
```bash
# Test backend is running
curl http://localhost:8000/health

# Expected: {"status":"ok",...}
```

#### 2. Authentication
- [ ] Open app
- [ ] Tap login button
- [ ] Redirected to GitHub
- [ ] Authorize app
- [ ] Redirected back to app
- [ ] See user profile

#### 3. Repository Features
- [ ] View repository list
- [ ] Scroll to load more (infinite scroll)
- [ ] Tap repository to view details
- [ ] Star/unstar repository
- [ ] View README
- [ ] Filter by language
- [ ] Filter by topic

#### 4. Trending
- [ ] View trending repositories
- [ ] Switch time period (daily/weekly/monthly)
- [ ] Filter by language

#### 5. Topics
- [ ] View topics list
- [ ] Follow/unfollow topic
- [ ] View topic details
- [ ] View repositories for topic

#### 6. Search
- [ ] Search repositories
- [ ] Search topics
- [ ] View search results
- [ ] Debouncing works (no API call on every keystroke)

#### 7. Profile
- [ ] View profile
- [ ] Edit profile
- [ ] View starred repositories
- [ ] View followed topics

#### 8. Offline Behavior
- [ ] Enable airplane mode
- [ ] App shows cached data
- [ ] Appropriate offline message
- [ ] Re-enable network
- [ ] App syncs automatically

### Automated Testing

Run the validation script:

```bash
# Make it executable
chmod +x scripts/test-integration.sh

# Run tests
./scripts/test-integration.sh
```

### API Testing with cURL

```bash
# Login (get token manually from app)
TOKEN="your_access_token_here"

# Test authenticated endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/users/me

# Test repository list
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/repositories?page=1&perPage=20

# Test search
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/search/repositories?q=react"
```

## Troubleshooting

### Backend Issues

**Problem: Backend won't start**
```bash
# Check Docker containers
docker-compose ps

# Check logs
docker-compose logs backend

# Restart services
docker-compose restart
```

**Problem: Database connection error**
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check database migrations
docker-compose exec backend alembic current

# Run migrations
docker-compose exec backend alembic upgrade head
```

**Problem: Redis connection error**
```bash
# Check Redis is running
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping
# Should return: PONG
```

### Frontend Issues

**Problem: Cannot connect to backend**

1. Check backend is running:
   ```bash
   curl http://localhost:8000/health
   ```

2. Check correct URL for your platform:
   - iOS Simulator: `http://localhost:8000`
   - Android Emulator: `http://10.0.2.2:8000`
   - Physical Device: `http://<YOUR_LOCAL_IP>:8000`

3. Check .env file:
   ```bash
   cat .env | grep API_URL
   ```

**Problem: OAuth redirect not working**

1. Check deep linking configuration:
   ```bash
   # iOS
   npx expo prebuild --platform ios
   
   # Android
   npx expo prebuild --platform android
   ```

2. Verify OAuth redirect URI:
   - Must be: `reponexus://callback`
   - Check GitHub OAuth app settings

**Problem: Network request failed**

1. Enable debug logging:
   ```env
   EXPO_PUBLIC_DEBUG_API=true
   EXPO_PUBLIC_DEBUG_NETWORK=true
   ```

2. Check Metro bundler logs
3. Check device network connection
4. Try restarting Metro bundler

### CORS Issues

If you see CORS errors in the browser/console:

1. Backend should have CORS configured:
   ```python
   # In backend/app/main.py
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],  # For development
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. For production, restrict origins:
   ```python
   allow_origins=[
       "https://app.reponexus.com",
       "reponexus://*"
   ]
   ```

## Common Issues

### 1. Token Expired

**Symptom**: 401 Unauthorized errors

**Solution**: The app automatically refreshes tokens. If it persists:
```typescript
// Logout and login again
await authService.logout();
```

### 2. Slow API Responses

**Symptom**: Requests take >5 seconds

**Solutions**:
- Check backend logs for slow queries
- Verify Redis is running (for caching)
- Check database indexes
- Monitor network tab in React Native Debugger

### 3. Stale Data

**Symptom**: Data doesn't update after mutations

**Solution**: Check query invalidation:
```typescript
// In mutation hooks, should have:
onSuccess: async () => {
  await queryClient.invalidateQueries({ 
    queryKey: queryKeys.repositories.all 
  });
}
```

### 4. Infinite Loading

**Symptom**: Loading spinner never stops

**Solutions**:
1. Check if API endpoint exists
2. Check response format matches types
3. Check error handling in query hooks
4. Look for network errors in console

### 5. Deep Linking Not Working

**Symptom**: OAuth redirect doesn't return to app

**Solutions**:
1. Rebuild app: `npx expo prebuild --clean`
2. Check URL scheme in app.json
3. Verify GitHub OAuth callback URL
4. Test deep link: `npx uri-scheme open reponexus://callback --ios`

## Performance Optimization

### Frontend
- Enable query deduplication (default in TanStack Query)
- Use pagination for large lists
- Implement virtual scrolling for long lists (@shopify/flash-list)
- Cache images and static content
- Prefetch data for better UX

### Backend
- Enable Redis caching
- Use database indexes
- Implement response compression
- Use pagination
- Enable query result caching

## Monitoring

### Development
- Use Expo Developer Menu: Shake device or Cmd+D (iOS) / Cmd+M (Android)
- Enable Remote JS Debugging
- Use React Native Debugger
- Monitor network requests

### Production
- Enable error reporting (Sentry)
- Enable analytics
- Monitor API performance
- Track user flows

## Next Steps

1. ✅ Complete environment setup
2. ✅ Configure OAuth
3. ✅ Test authentication flow
4. ✅ Test all API endpoints
5. ✅ Implement error handling
6. ✅ Add offline support
7. ✅ Test on physical devices
8. ✅ Prepare for production deployment

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Expo Documentation](https://docs.expo.dev/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [React Native Documentation](https://reactnative.dev/)

## Support

For issues or questions:
1. Check this documentation
2. Review backend logs: `docker-compose logs backend`
3. Review frontend logs in Expo Dev Tools
4. Check GitHub issues
5. Create a new issue with:
   - Environment details
   - Error messages
   - Steps to reproduce
   - Expected vs actual behavior
