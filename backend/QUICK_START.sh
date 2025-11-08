#!/bin/bash
# Quick Start Script for Token Authentication Testing

set -e

echo "=================================="
echo "Repo Nexus Token Auth Quick Start"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Starting Services...${NC}"
echo "Note: Run these commands if services aren't already running:"
echo ""
echo "  sudo service postgresql start"
echo "  redis-server --daemonize yes"
echo ""

echo -e "${BLUE}Step 2: Starting API Server...${NC}"
echo "Run in a separate terminal:"
echo ""
echo "  cd /home/user/reponexus/backend"
echo "  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo ""

echo -e "${BLUE}Step 3: Test Token Authentication${NC}"
echo "Run the automated test:"
echo ""
echo "  python test_github_token.py"
echo ""

echo -e "${YELLOW}OR use curl manually:${NC}"
echo ""
echo "# Login with token:"
echo 'curl -X POST "http://localhost:8000/api/v1/auth/token" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"github_token": "ghp_REDACTED_TOKEN_FOR_SECURITY"}'"'"
echo ""
echo "# Extract and save the JWT token from the response"
echo 'export JWT="<paste_access_token_here>"'
echo ""
echo "# Test protected endpoint:"
echo 'curl -H "Authorization: Bearer $JWT" http://localhost:8000/api/v1/users/me'
echo ""

echo -e "${GREEN}✓ Token authentication system is ready!${NC}"
echo ""
echo "Documentation: TOKEN_AUTH_SETUP.md"
echo "Summary: IMPLEMENTATION_SUMMARY.txt"
