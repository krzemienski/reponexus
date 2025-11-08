# Quick Start: Full Stack Integration

Get the full stack running in 5 minutes.

## Prerequisites Check

```bash
# Check Node.js
node --version  # Should be 20+

# Check Python
python --version  # Should be 3.12+

# Check Docker
docker --version
docker-compose --version
```

## Step 1: Start Backend (2 minutes)

```bash
cd backend

# Start all services with Docker
docker-compose up -d

# Wait for services to start (check logs)
docker-compose logs -f

# Verify backend is running
curl http://localhost:8000/health
# Should return: {"status":"ok",...}
```

## Step 2: Configure GitHub OAuth (1 minute)

1. Go to: https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Name**: Repo Nexus Dev
   - **Homepage URL**: `http://localhost:8081`
   - **Authorization callback URL**: `reponexus://callback`
4. Click "Register application"
5. Copy the **Client ID**
6. Generate a **Client Secret**

## Step 3: Configure Environment (1 minute)

```bash
cd ..  # Back to root

# Copy environment template
cp .env.example .env

# Edit .env
nano .env  # or use your editor
```

**Minimum required configuration:**
```env
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_GITHUB_CLIENT_ID=your_client_id_here
```

**Also update backend/.env:**
```env
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
```

## Step 4: Start Frontend (1 minute)

```bash
# Install dependencies (first time only)
npm install

# Start Expo
npm start
```

## Step 5: Test Integration

### Option A: Automated Tests
```bash
./scripts/test-integration.sh
```

### Option B: Manual Testing
1. Press `i` for iOS Simulator or `a` for Android Emulator
2. App should load
3. Tap "Login" button
4. Complete GitHub OAuth flow
5. You should see your profile!

## Platform-Specific URLs

### iOS Simulator
- Uses `http://localhost:8000` (default)
- No changes needed

### Android Emulator
- Automatically uses `http://10.0.2.2:8000`
- No changes needed (handled by `utils/apiConfig.ts`)

### Physical Device
Update `.env`:
```env
# Replace with your computer's local IP
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
```

**Find your IP:**
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr IPv4
```

## Troubleshooting

### Backend not starting
```bash
# Check Docker containers
docker-compose ps

# Restart services
docker-compose restart

# Check logs
docker-compose logs backend
```

### Cannot connect to backend
```bash
# Test backend directly
curl http://localhost:8000/health

# For Android emulator, test 10.0.2.2
curl http://10.0.2.2:8000/health

# Check backend logs
docker-compose logs -f backend
```

### OAuth redirect not working
1. Verify callback URL in GitHub OAuth app: `reponexus://callback`
2. Rebuild app: `npx expo prebuild --clean`
3. Check app.json has correct scheme: `"scheme": "reponexus"`

### "Network request failed"
1. Check backend is running: `docker-compose ps`
2. Check .env has correct URL
3. For physical device, use local IP not localhost
4. Restart Metro bundler: Press `r` in terminal

## Quick Commands

```bash
# Restart everything
docker-compose restart && npm start

# View backend logs
docker-compose logs -f backend

# View database logs
docker-compose logs -f postgres

# Stop all services
docker-compose down

# Clean restart
docker-compose down -v && docker-compose up -d

# Run tests
./scripts/test-integration.sh

# Clear Expo cache
npm start -- --clear
```

## Development Workflow

```bash
# Terminal 1: Backend
cd backend
docker-compose up

# Terminal 2: Frontend
npm start

# Terminal 3: Tests/Commands
./scripts/test-integration.sh
```

## API Documentation

Once backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Next Steps

1. ✅ Got it running? Great!
2. Read `INTEGRATION.md` for detailed documentation
3. Check `INTEGRATION_REPORT.md` for architecture details
4. Review API client code in `services/api/client.ts`
5. Explore query hooks in `hooks/queries/`

## Need Help?

1. Check `INTEGRATION.md` for detailed troubleshooting
2. Review backend logs: `docker-compose logs backend`
3. Check Metro bundler logs in terminal
4. Verify environment variables in `.env`
5. Ensure GitHub OAuth is configured correctly

---

**That's it!** You should have a fully functional full-stack app running locally.
