# Token-Based Authentication - Testing Guide

## Overview
This guide explains how to use the new token-based authentication feature for testing the Repo Nexus frontend without going through the full GitHub OAuth flow.

## Features Implemented

### 1. Token Login Screen
- **Location**: `app/(auth)/token-login.tsx`
- **Features**:
  - Simple text input for GitHub Personal Access Token
  - Show/hide token visibility toggle
  - Instructions for obtaining a GitHub token
  - Validates token before submission
  - Error handling with haptic feedback
  - "Use OAuth Instead" button to return to normal login

### 2. Token Authentication Hook
- **Location**: `hooks/useTokenAuth.ts`
- **Exports**:
  - `useTokenAuth()` - Main hook for token login
  - `useDevSettings()` - Development utilities for managing auth state

### 3. Updated Login Screen
- **Location**: `app/(auth)/login.tsx`
- **Changes**:
  - Added "Test with Token (Dev)" button (only visible in `__DEV__` mode)
  - Links to token login screen

### 4. Dev Settings Screen
- **Location**: `app/dev-settings.tsx`
- **Features**:
  - View current authentication status
  - Display JWT token details
  - Show token expiration time (auto-refreshes every 5 seconds)
  - Copy token to clipboard
  - Clear auth data button
  - Refresh user data button
  - Quick access to token login
  - Only accessible in development mode

### 5. API Integration
- **Updated**: `utils/constants.ts`
- **Added**: `TOKEN_AUTH` endpoint: `/api/v1/auth/token`
- The existing API client already handles JWT tokens properly

## How to Use

### Step 1: Get a GitHub Personal Access Token

1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "Repo Nexus Testing")
4. Select the following scopes:
   - `user` - Read user profile data
   - `repo` - Access repositories
   - `read:org` - Read organization data
5. Click "Generate token"
6. **Copy the token immediately** (you won't be able to see it again!)

### Step 2: Login with Token

1. Launch the app in development mode
2. On the login screen, you'll see a "Test with Token (Dev)" button
3. Tap the button to go to the token login screen
4. Paste your GitHub token
5. Tap "Login with Token"
6. If successful, you'll be navigated to the main app

### Step 3: Access Dev Settings (Optional)

1. Navigate to `/dev-settings` in your app
2. View your current authentication status
3. See your JWT token details and expiration time
4. Copy the JWT token if needed for API testing
5. Clear auth data when done testing

## Testing Workflow

### Quick Test Flow
```
1. Launch app in dev mode
2. Tap "Test with Token (Dev)"
3. Paste your GitHub token
4. Login
5. Test the app features
6. Go to dev-settings to view auth state
7. Clear auth data when done
```

### API Testing with JWT
```
1. Login with token
2. Navigate to /dev-settings
3. Copy the JWT token
4. Use it in API requests with header:
   Authorization: Bearer <your-jwt-token>
```

## Files Created/Modified

### Created
- `/home/user/reponexus/hooks/useTokenAuth.ts` - Token auth hook
- `/home/user/reponexus/app/(auth)/token-login.tsx` - Token login screen
- `/home/user/reponexus/app/dev-settings.tsx` - Dev settings screen

### Modified
- `/home/user/reponexus/utils/constants.ts` - Added TOKEN_AUTH endpoint
- `/home/user/reponexus/app/(auth)/login.tsx` - Added dev token login button

### Dependencies Added
- `expo-clipboard` - For copying tokens to clipboard

## Security Notes

1. **Development Only**: All token login features are only available in `__DEV__` mode
2. **Token Storage**: GitHub tokens are sent to the backend and exchanged for JWT tokens
3. **No Server Storage**: Your GitHub token is never stored on the server (only used for exchange)
4. **JWT Tokens**: The JWT tokens are stored securely using `expo-secure-store`
5. **Session Management**: JWT tokens expire after a set time period

## Troubleshooting

### Token Login Fails
- Verify your GitHub token is valid and not expired
- Ensure you selected the correct scopes (user, repo, read:org)
- Check that the backend `/api/v1/auth/token` endpoint is running
- Look at console logs for detailed error messages

### Token Not Showing in Dev Settings
- Ensure you're logged in
- Refresh the screen by tapping the refresh button
- Check that tokens are stored (look at console logs)

### JWT Token Expired
- The dev settings screen shows time remaining
- When expired, you'll need to login again
- The app will automatically try to refresh the token

## Example Screenshots

### Login Screen (Dev Mode)
- Shows GitHub OAuth button
- Shows Biometric button (if enabled)
- Shows "Test with Token (Dev)" button at the bottom

### Token Login Screen
- Clean form with instructions
- GitHub token input field
- Show/hide toggle for token visibility
- Login button
- Back to OAuth button

### Dev Settings Screen
- Authentication status card
- JWT token info card with expiration countdown
- Developer actions (token login, clear auth)
- Warning banner (dev only)

## Backend Requirements

The backend must implement the following endpoint:

```
POST /api/v1/auth/token
Body: { "githubToken": "ghp_xxxx..." }
Response: {
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "expiresIn": 3600,
  "user": { ... }
}
```

## Future Enhancements

Potential improvements for this feature:
- Pre-filled test tokens for common test users
- Token validation before submission
- Multiple test accounts with saved tokens
- Token expiry warnings
- Auto-refresh tokens when near expiry
