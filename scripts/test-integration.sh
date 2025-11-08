#!/bin/bash

# Integration Test Script for Repo Nexus
# This script validates the frontend-backend integration

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
TIMEOUT=5

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_test() {
    echo -e "${YELLOW}Testing:${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((TESTS_PASSED++))
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    ((TESTS_FAILED++))
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local expected_status=$4
    local headers=$5

    ((TESTS_RUN++))
    print_test "$name"

    local url="${BACKEND_URL}${endpoint}"
    local response
    local status_code

    if [ -z "$headers" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" --max-time $TIMEOUT 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" -H "$headers" --max-time $TIMEOUT 2>&1)
    fi

    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$status_code" = "$expected_status" ]; then
        print_success "Status: $status_code (Expected: $expected_status)"
        return 0
    else
        print_error "Status: $status_code (Expected: $expected_status)"
        echo "    Response: $body"
        return 1
    fi
}

# Main test execution
main() {
    print_header "Repo Nexus Integration Tests"
    
    print_info "Backend URL: $BACKEND_URL"
    print_info "Timeout: ${TIMEOUT}s"
    echo ""

    # Test 1: Backend Health Check
    print_header "1. Backend Health Check"
    test_endpoint "Health endpoint" "GET" "/health" "200" || true

    # Test 2: API Availability
    print_header "2. API Endpoints Availability"
    
    # These should return 401 (Unauthorized) without auth token
    test_endpoint "Auth - Me (no token)" "GET" "/api/v1/auth/me" "401" || true
    test_endpoint "Repositories list (no token)" "GET" "/api/v1/repositories" "401" || true
    test_endpoint "Topics list (no token)" "GET" "/api/v1/topics" "401" || true
    test_endpoint "Users - Me (no token)" "GET" "/api/v1/users/me" "401" || true

    # Test 3: API Documentation
    print_header "3. API Documentation"
    test_endpoint "OpenAPI Docs" "GET" "/docs" "200" || true
    test_endpoint "ReDoc" "GET" "/redoc" "200" || true
    test_endpoint "OpenAPI JSON" "GET" "/openapi.json" "200" || true

    # Test 4: CORS Headers
    print_header "4. CORS Configuration"
    print_test "CORS headers"
    ((TESTS_RUN++))
    
    cors_response=$(curl -s -I -X OPTIONS "${BACKEND_URL}/api/v1/repositories" \
        -H "Origin: http://localhost:8081" \
        -H "Access-Control-Request-Method: GET" \
        --max-time $TIMEOUT 2>&1)
    
    if echo "$cors_response" | grep -qi "access-control-allow-origin"; then
        print_success "CORS headers present"
    else
        print_error "CORS headers missing"
        echo "    This may cause issues with the frontend"
    fi

    # Test 5: Search Endpoint Format
    print_header "5. Search Endpoint Format"
    test_endpoint "Search repositories format" "GET" "/api/v1/search/repositories?q=test" "401" || true
    test_endpoint "Search topics format" "GET" "/api/v1/search/topics?q=test" "401" || true

    # Test 6: Trending Endpoint
    print_header "6. Trending Endpoint"
    test_endpoint "Trending repositories" "GET" "/api/v1/repositories/trending?period=daily" "401" || true

    # Summary
    print_header "Test Summary"
    echo ""
    echo -e "Total Tests:  ${BLUE}$TESTS_RUN${NC}"
    echo -e "Passed:       ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Failed:       ${RED}$TESTS_FAILED${NC}"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}All tests passed!${NC}"
        echo ""
        print_info "Backend is ready for frontend integration"
        return 0
    else
        echo -e "${RED}Some tests failed${NC}"
        echo ""
        print_info "Please check the backend configuration and logs"
        return 1
    fi
}

# Check if backend is reachable
print_header "Pre-flight Check"
print_test "Backend connectivity"
if curl -s --max-time $TIMEOUT "${BACKEND_URL}/health" > /dev/null 2>&1; then
    print_success "Backend is reachable"
    main
else
    print_error "Cannot connect to backend at $BACKEND_URL"
    echo ""
    print_info "Make sure the backend is running:"
    echo "  cd backend"
    echo "  docker-compose up -d"
    echo ""
    print_info "Or specify a different URL:"
    echo "  BACKEND_URL=http://10.0.2.2:8000 ./scripts/test-integration.sh"
    exit 1
fi
