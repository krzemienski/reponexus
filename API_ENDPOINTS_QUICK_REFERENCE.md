# API Endpoints Quick Reference

## New Endpoints Implemented (9 Total)

### 1. Notifications API (`/api/v1/notifications`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/notifications` | List user notifications | Yes |
| GET | `/api/v1/notifications/unread` | Get unread count | Yes |
| PATCH | `/api/v1/notifications/{id}/read` | Mark as read | Yes |
| PATCH | `/api/v1/notifications/read-all` | Mark all as read | Yes |
| DELETE | `/api/v1/notifications/{id}` | Delete notification | Yes |

**Query Parameters for GET /notifications:**
- `page` (int, default=1): Page number
- `per_page` (int, default=20, max=100): Items per page
- `unread_only` (bool, default=false): Show only unread

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/v1/notifications?page=1&per_page=20&unread_only=true"
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "star",
      "title": "New star on repository",
      "message": "Someone starred your repository",
      "link": "/repositories/123",
      "is_read": false,
      "created_at": "2025-11-08T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "per_page": 20,
    "pages": 3
  }
}
```

---

### 2. Settings API (`/api/v1/settings`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/settings` | Get user settings | Yes |
| PATCH | `/api/v1/settings` | Update settings | Yes |

**Configurable Settings:**
- `theme` (enum): "light", "dark", "auto"
- `notifications_enabled` (bool): Enable/disable notifications
- `email_notifications` (bool): Enable/disable email
- `language` (str): Language code (e.g., "en", "es")
- `timezone` (str): Timezone (e.g., "UTC", "America/New_York")

**Example Request:**
```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "theme": "dark",
    "notifications_enabled": true,
    "language": "en"
  }' \
  http://localhost:8000/api/v1/settings
```

**Example Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "theme": "dark",
  "notifications_enabled": true,
  "email_notifications": true,
  "language": "en",
  "timezone": "UTC",
  "created_at": "2025-11-08T12:00:00Z",
  "updated_at": "2025-11-08T12:30:00Z"
}
```

---

### 3. Search Suggestions API (`/api/v1/search/suggestions`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/search/suggestions` | Get search suggestions | Optional* |

*Returns empty array for unauthenticated users

**Query Parameters:**
- `limit` (int, default=10, max=50): Number of suggestions

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/v1/search/suggestions?limit=10"
```

**Example Response:**
```json
{
  "suggestions": [
    {
      "query": "react",
      "type": "repository",
      "count": 5
    },
    {
      "query": "python machine learning",
      "type": "repository",
      "count": 3
    }
  ],
  "count": 2
}
```

---

### 4. Activity Feed API (`/api/v1/users/me/activity`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/users/me/activity` | Get user activity feed | Yes |

**Query Parameters:**
- `page` (int, default=1): Page number
- `per_page` (int, default=20, max=100): Items per page
- `event_type` (str, optional): Filter by event type

**Event Types:**
- `view` - Repository/topic views
- `star` - Repository stars
- `search` - Search queries
- `click` - Link clicks

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/v1/users/me/activity?page=1&event_type=star"
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "event_type": "star",
      "entity_type": "repository",
      "entity_id": "123",
      "metadata": {
        "repository_name": "awesome-project"
      },
      "created_at": "2025-11-08T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 156,
    "page": 1,
    "per_page": 20,
    "pages": 8
  }
}
```

---

## Authentication

All endpoints (except search suggestions) require JWT Bearer token authentication:

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:8000/api/v1/endpoint
```

To obtain a token, use the `/api/v1/auth/login` endpoint (existing).

---

## Rate Limits

- **Read operations (GET):** 60 requests/minute
- **Write operations (POST/PATCH/DELETE):** 30 requests/minute

---

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Invalid authentication credentials"
}
```

### 404 Not Found
```json
{
  "detail": "Notification not found"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "theme"],
      "msg": "value is not a valid enumeration member",
      "type": "type_error.enum"
    }
  ]
}
```

---

## Testing with Swagger UI

1. Start the server:
   ```bash
   cd /home/user/reponexus/backend
   uvicorn app.main:app --reload
   ```

2. Open browser: `http://localhost:8000/docs`

3. Click "Authorize" button and enter your Bearer token

4. Try out the endpoints interactively

---

## Database Models

### Notification
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users
- `type` (enum) - Notification type
- `title` (str) - Notification title
- `message` (str) - Notification message
- `link` (str, optional) - Related link
- `is_read` (bool) - Read status
- `created_at` (datetime) - Creation timestamp
- `read_at` (datetime, optional) - Read timestamp

### Settings
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users (unique)
- `theme` (enum) - UI theme
- `notifications_enabled` (bool) - Notifications on/off
- `email_notifications` (bool) - Email on/off
- `language` (str) - Language code
- `timezone` (str) - Timezone
- `created_at` (datetime) - Creation timestamp
- `updated_at` (datetime) - Update timestamp

### SearchHistory
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users
- `query` (str) - Search query
- `result_type` (enum) - Type of search
- `result_count` (int) - Number of results
- `ip_address` (str, optional) - User IP
- `created_at` (datetime) - Creation timestamp

---

For detailed implementation information, see `IMPLEMENTATION_SUMMARY.md`
