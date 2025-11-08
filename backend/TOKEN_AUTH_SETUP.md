# Token-Based Authentication Setup - Complete

## Overview

Successfully implemented GitHub token-based authentication for Repo Nexus testing. This allows authentication using a GitHub personal access token instead of the OAuth flow.

## Files Created

### 1. GitHub Token Service
**File:** `/home/user/reponexus/backend/app/services/github_token_service.py`
- Class: `GitHubTokenService`
- Methods:
  - `verify_token()` - Verifies if GitHub token is valid
  - `get_user_info()` - Fetches user information from GitHub API
- Uses httpx async client with GitHub API v3
- Handles primary email fetching if public email not available

### 2. Token Auth Endpoint
**File:** `/home/user/reponexus/backend/app/api/v1/auth_token.py`
- Endpoint: `POST /api/v1/auth/token`
- Endpoint: `GET /api/v1/auth/token/verify`
- Validates GitHub token
- Creates/updates user in database
- Generates JWT access token
- Returns user information

### 3. Pydantic Schemas
**File:** `/home/user/reponexus/backend/app/schemas/auth_token.py`
- `TokenLoginRequest` - Request schema with GitHub token validation
- `TokenLoginResponse` - Response schema with JWT and user data
- `GitHubUserInfo` - GitHub user data schema

### 4. Configuration Updates
**File:** `/home/user/reponexus/backend/app/core/config.py`
- Added `TEST_GITHUB_TOKEN` setting
- Added `ENABLE_TOKEN_AUTH` setting

**File:** `/home/user/reponexus/backend/app/main.py`
- Imported `auth_token` router
- Mounted token auth router at `/api/v1/auth`

**File:** `/home/user/reponexus/backend/.env`
- Added `TEST_GITHUB_TOKEN=ghp_REDACTED_TOKEN_FOR_SECURITY`
- Added `ENABLE_TOKEN_AUTH=true`

### 5. Test Script
**File:** `/home/user/reponexus/backend/test_github_token.py`
- Comprehensive test script with colored output
- Tests health check, token verification, login, and protected endpoints
- Provides example commands and code snippets

---

## API Endpoints

### 1. Login with Token
**Endpoint:** `POST /api/v1/auth/token`

**Request:**
```json
{
  "github_token": "ghp_REDACTED_TOKEN_FOR_SECURITY"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "uuid-here",
    "github_id": "123456",
    "login": "username",
    "name": "Full Name",
    "email": "user@example.com",
    "avatar_url": "https://avatars.githubusercontent.com/...",
    "bio": "Developer bio",
    "company": "Company Name",
    "location": "City, Country",
    "public_repos": 50,
    "followers": 100,
    "following": 75
  }
}
```

### 2. Verify Token
**Endpoint:** `GET /api/v1/auth/token/verify?github_token=ghp_...`

**Response:**
```json
{
  "valid": true,
  "message": "Token is valid"
}
```

---

## Testing Instructions

### Prerequisites

1. **Start PostgreSQL:**
```bash
sudo service postgresql start
```

2. **Start Redis:**
```bash
redis-server --daemonize yes
```

3. **Start API Server:**
```bash
cd /home/user/reponexus/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Run Automated Test

```bash
cd /home/user/reponexus/backend
python test_github_token.py
```

### Manual Testing with cURL

#### 1. Verify GitHub Token
```bash
curl -X GET "http://localhost:8000/api/v1/auth/token/verify?github_token=ghp_REDACTED_TOKEN_FOR_SECURITY"
```

#### 2. Login with Token
```bash
curl -X POST "http://localhost:8000/api/v1/auth/token" \
  -H "Content-Type: application/json" \
  -d '{
    "github_token": "ghp_REDACTED_TOKEN_FOR_SECURITY"
  }'
```

#### 3. Save JWT Token
```bash
# Extract the access_token from the response above
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 4. Test Protected Endpoint (Get Current User)
```bash
curl -X GET "http://localhost:8000/api/v1/users/me" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### 5. Test Other Protected Endpoints
```bash
# Get repositories
curl -X GET "http://localhost:8000/api/v1/repositories" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Get topics
curl -X GET "http://localhost:8000/api/v1/topics" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Get trending
curl -X GET "http://localhost:8000/api/v1/explore/trending" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

## Python Code Examples

### Example 1: Simple Login
```python
import httpx
import asyncio

async def login_with_token():
    github_token = "ghp_REDACTED_TOKEN_FOR_SECURITY"

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/v1/auth/token",
            json={"github_token": github_token}
        )

        if response.status_code == 200:
            data = response.json()
            print(f"Login successful!")
            print(f"JWT Token: {data['access_token']}")
            print(f"User: {data['user']['login']}")
            return data['access_token']
        else:
            print(f"Login failed: {response.text}")
            return None

# Run
asyncio.run(login_with_token())
```

### Example 2: Full Authentication Flow
```python
import httpx
import asyncio

class RepoNexusClient:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.api_prefix = "/api/v1"
        self.access_token = None

    async def login(self, github_token: str):
        """Login with GitHub token and get JWT"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}{self.api_prefix}/auth/token",
                json={"github_token": github_token}
            )
            response.raise_for_status()
            data = response.json()
            self.access_token = data['access_token']
            return data['user']

    def get_headers(self):
        """Get authorization headers"""
        if not self.access_token:
            raise ValueError("Not authenticated. Call login() first.")
        return {"Authorization": f"Bearer {self.access_token}"}

    async def get_repositories(self, **params):
        """Get repositories"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}{self.api_prefix}/repositories",
                headers=self.get_headers(),
                params=params
            )
            response.raise_for_status()
            return response.json()

    async def get_topics(self, **params):
        """Get topics"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}{self.api_prefix}/topics",
                headers=self.get_headers(),
                params=params
            )
            response.raise_for_status()
            return response.json()

# Usage
async def main():
    client = RepoNexusClient()

    # Login
    user = await client.login("ghp_REDACTED_TOKEN_FOR_SECURITY")
    print(f"Logged in as: {user['login']}")

    # Get repositories
    repos = await client.get_repositories(limit=10)
    print(f"Found {len(repos['items'])} repositories")

    # Get topics
    topics = await client.get_topics(limit=10)
    print(f"Found {len(topics['items'])} topics")

asyncio.run(main())
```

---

## Authentication Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. POST /api/v1/auth/token
       │    {"github_token": "ghp_..."}
       ▼
┌─────────────────────┐
│  Token Auth API     │
└──────┬──────────────┘
       │ 2. Verify token
       ▼
┌─────────────────────┐
│  GitHub API         │ https://api.github.com/user
│  (Bearer token)     │
└──────┬──────────────┘
       │ 3. Return user info
       ▼
┌─────────────────────┐
│  Database           │
│  Create/Update User │
└──────┬──────────────┘
       │ 4. Generate JWT
       ▼
┌─────────────────────┐
│  Return to Client   │
│  {access_token, user}│
└──────┬──────────────┘
       │ 5. Use JWT for protected endpoints
       ▼
┌─────────────────────┐
│  Protected APIs     │
│  (Bearer JWT)       │
└─────────────────────┘
```

---

## Environment Variables

```bash
# Token Authentication (Added to .env)
TEST_GITHUB_TOKEN=ghp_REDACTED_TOKEN_FOR_SECURITY
ENABLE_TOKEN_AUTH=true

# These must also be set for the server to run
DATABASE_URL=postgresql+asyncpg://postgres:reponexus@localhost:5432/reponexus
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=dev-secret-key-change-in-production-12345678901234567890
```

---

## API Documentation

Once the server is running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

The new token authentication endpoints will appear under the "auth" tag.

---

## Security Notes

1. **Token Storage:** GitHub tokens are stored in the database (not encrypted in current implementation)
2. **JWT Expiration:** Access tokens expire after 30 minutes (configurable)
3. **Token Validation:** Tokens are validated against GitHub API on every login
4. **HTTPS Required:** In production, always use HTTPS for token transmission
5. **Token Scopes:** Ensure GitHub token has appropriate scopes (read:user, user:email)

---

## Troubleshooting

### Issue: "Invalid GitHub token"
- Check token format (must start with ghp_, gho_, or ghs_)
- Verify token is not expired
- Ensure token has correct scopes

### Issue: "Cannot connect to API server"
- Ensure PostgreSQL is running: `sudo service postgresql start`
- Ensure Redis is running: `redis-server --daemonize yes`
- Start the API server: `uvicorn app.main:app --reload`

### Issue: "Database connection failed"
- Check DATABASE_URL in .env
- Verify PostgreSQL is accessible: `psql -h localhost -U postgres`
- Check database exists: `createdb reponexus`

### Issue: "User not found after login"
- Check database tables created: Tables are auto-created on startup
- Check user table: `psql reponexus -c "SELECT * FROM users;"`

---

## Next Steps

1. **Start Services:**
   - PostgreSQL
   - Redis
   - FastAPI server

2. **Run Tests:**
   ```bash
   python test_github_token.py
   ```

3. **Get JWT Token:**
   - Use the test script or curl commands
   - Save the JWT token for API requests

4. **Test Protected Endpoints:**
   - Use the JWT token to access protected endpoints
   - Verify authentication works correctly

5. **Integration:**
   - Update frontend to use token authentication
   - Add token refresh logic
   - Implement token revocation

---

## Success Criteria

✅ GitHub Token Service created
✅ Token Auth Endpoint created
✅ Pydantic Schemas created
✅ Main Router updated
✅ Test Script created
✅ .env updated
✅ Configuration updated

All components are in place and ready for testing once services are running.
