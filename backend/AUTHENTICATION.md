# Repo Nexus - Backend Authentication System

## Overview

This document describes the complete authentication system implementation for Repo Nexus, including GitHub OAuth integration, JWT token management, session handling, rate limiting, and audit logging.

## Architecture

### Components

1. **Pydantic Schemas** (`app/schemas/`)
   - `user.py`: User data models and validation
   - `auth.py`: Authentication request/response models

2. **SQLAlchemy Models** (`app/models/`)
   - `user.py`: User database model
   - `audit_log.py`: Audit logging for security events

3. **Services** (`app/services/`)
   - `auth_service.py`: Core authentication logic
   - `audit_service.py`: Audit logging operations

4. **Core Utilities** (`app/core/`)
   - `security.py`: JWT token generation and validation
   - `rate_limit.py`: Rate limiting with Redis
   - `cache.py`: Redis caching utilities

5. **Middleware** (`app/middleware/`)
   - `security.py`: Security headers and request tracking

6. **API Routes** (`app/api/v1/auth.py`)
   - Authentication endpoints

## Authentication Flow

### 1. GitHub OAuth Login

```
User -> Frontend -> /auth/login (GET GitHub OAuth URL)
Frontend -> GitHub (Redirect to OAuth)
GitHub -> Frontend (Callback with code)
Frontend -> /auth/callback (POST with code)
Backend -> GitHub (Exchange code for token)
Backend -> GitHub (Fetch user data)
Backend -> Database (Create/update user)
Backend -> Redis (Create session)
Backend -> Frontend (Return JWT tokens)
```

### 2. Token Types

- **Access Token**: Short-lived (30 minutes), used for API requests
- **Refresh Token**: Long-lived (30 days), used to obtain new access tokens

### 3. Session Management

Sessions are stored in Redis with the following structure:
```json
{
  "user_id": "uuid",
  "access_token": "jwt",
  "refresh_token": "jwt",
  "ip_address": "127.0.0.1",
  "user_agent": "Mozilla/...",
  "created_at": "2024-11-07T...",
  "expires_at": "2024-11-07T..."
}
```

Session TTL: 30 minutes (automatically extended on activity)

## API Endpoints

### POST /api/v1/auth/login

Returns GitHub OAuth URL for authentication.

**Response:**
```json
{
  "auth_url": "https://github.com/login/oauth/authorize?...",
  "message": "Redirect user to this URL to authenticate with GitHub"
}
```

### POST /api/v1/auth/callback

Exchange OAuth code for JWT tokens.

**Request:**
```json
{
  "code": "github_oauth_code"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "uuid",
    "login": "username",
    "name": "Full Name",
    "email": "user@example.com",
    "avatar_url": "https://...",
    ...
  }
}
```

### POST /api/v1/auth/refresh

Refresh access token using refresh token.

**Request:**
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### POST /api/v1/auth/logout

Logout user and invalidate tokens.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Successfully logged out",
  "success": true
}
```

### GET /api/v1/auth/me

Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": "uuid",
  "login": "username",
  "name": "Full Name",
  "email": "user@example.com",
  "avatar_url": "https://...",
  "bio": "User bio",
  ...
}
```

## Security Features

### 1. Rate Limiting

- **IP-based**: 60 requests per minute per IP
- **User-based**: Can be configured per endpoint
- **Auth endpoints**: 10 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1699368000
```

### 2. Security Headers

All responses include:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'...
Strict-Transport-Security: max-age=31536000
```

### 3. Request Tracking

Every request gets:
```
X-Request-ID: unique-uuid
X-Process-Time: processing-time-in-seconds
```

### 4. Audit Logging

All authentication events are logged:
- Successful logins
- Failed login attempts
- Token refreshes
- Logouts
- Unauthorized access attempts
- Rate limit violations

Audit log structure:
```python
{
  "event_type": "login",
  "event_status": "success",
  "user_id": "uuid",
  "user_login": "username",
  "ip_address": "127.0.0.1",
  "user_agent": "Mozilla/...",
  "created_at": "2024-11-07T..."
}
```

## Environment Variables

Required environment variables in `.env`:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/callback

# JWT
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=30

# Redis
REDIS_URL=redis://localhost:6379/0

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
```

## Testing

Run authentication tests:

```bash
# Run all tests
pytest tests/

# Run only auth tests
pytest tests/api/test_auth.py

# Run with coverage
pytest --cov=app --cov-report=html tests/
```

## Database Migrations

Create migration for audit logs:

```bash
# Generate migration
alembic revision --autogenerate -m "Add audit_log table"

# Apply migration
alembic upgrade head
```

## Usage Examples

### Frontend Integration

```javascript
// 1. Get OAuth URL
const { auth_url } = await fetch('/api/v1/auth/login').then(r => r.json());

// 2. Redirect to GitHub
window.location.href = auth_url;

// 3. Handle callback (after GitHub redirects back)
const code = new URLSearchParams(window.location.search).get('code');
const { access_token, refresh_token, user } = await fetch('/api/v1/auth/callback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code })
}).then(r => r.json());

// 4. Store tokens
localStorage.setItem('access_token', access_token);
localStorage.setItem('refresh_token', refresh_token);

// 5. Use access token for API requests
const response = await fetch('/api/v1/repositories', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});

// 6. Refresh token when expired
const { access_token: new_token } = await fetch('/api/v1/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refresh_token })
}).then(r => r.json());

// 7. Logout
await fetch('/api/v1/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});
```

## Troubleshooting

### Common Issues

1. **"Invalid OAuth code"**
   - Code may have expired (valid for 10 minutes)
   - Code may have already been used
   - Restart OAuth flow

2. **"Refresh token not found"**
   - Token may have expired (30 days)
   - Session may have been cleared
   - User needs to login again

3. **"Rate limit exceeded"**
   - Too many requests from same IP
   - Wait for rate limit to reset (check `Retry-After` header)

4. **"User not found"**
   - Token is valid but user was deleted
   - Clear tokens and login again

## Security Best Practices

1. **Always use HTTPS** in production
2. **Store tokens securely** (httpOnly cookies preferred over localStorage)
3. **Implement token refresh** before expiration
4. **Handle logout** on all devices
5. **Monitor audit logs** for suspicious activity
6. **Rotate secrets** regularly
7. **Use environment variables** for sensitive data

## Future Enhancements

- [ ] Token encryption in database
- [ ] Multi-factor authentication (MFA)
- [ ] OAuth with multiple providers
- [ ] Device management (list/revoke sessions)
- [ ] IP whitelist/blacklist
- [ ] Passwordless authentication
- [ ] SSO integration

## Related Files

- `app/schemas/user.py` - User schemas
- `app/schemas/auth.py` - Auth schemas
- `app/models/user.py` - User model
- `app/models/audit_log.py` - Audit log model
- `app/services/auth_service.py` - Auth service
- `app/services/audit_service.py` - Audit service
- `app/api/v1/auth.py` - Auth routes
- `app/core/security.py` - Security utilities
- `app/core/rate_limit.py` - Rate limiting
- `app/middleware/security.py` - Security middleware
- `tests/api/test_auth.py` - Auth tests
