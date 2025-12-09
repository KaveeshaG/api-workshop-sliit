#!/bin/bash

# Redis Integration Test Script
# This script tests the Redis caching functionality in task-service

echo "🔍 Redis Integration Test"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Redis is running
echo "1️⃣  Checking Redis connection..."
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo -e "${RED}❌ Redis is not running${NC}"
    echo "Start Redis with: brew services start redis"
    exit 1
fi

echo ""

# Get auth token
echo "2️⃣  Getting authentication token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⚠️  No existing user, creating one...${NC}"
    
    # Register user
    curl -s -X POST http://localhost:3001/api/v1/auth/register \
      -H "Content-Type: application/json" \
      -d '{"username":"testuser","password":"test123","role":"User"}' > /dev/null
    
    # Login again
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
      -H "Content-Type: application/json" \
      -d '{"username":"testuser","password":"test123"}')
    
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Failed to get authentication token${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Got authentication token${NC}"
echo ""

# Clear Redis cache
echo "3️⃣  Clearing Redis cache..."
redis-cli DEL tasks > /dev/null
echo -e "${GREEN}✅ Cache cleared${NC}"
echo ""

# First request (should be cache miss)
echo "4️⃣  First request (should be CACHE MISS)..."
echo "   Watching task-service logs for 'Cache Miss'..."
START_TIME=$(date +%s%N)
curl -s -X GET http://localhost:3002/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN" > /dev/null
END_TIME=$(date +%s%N)
FIRST_REQUEST_TIME=$(( ($END_TIME - $START_TIME) / 1000000 ))
echo -e "${YELLOW}   Response time: ${FIRST_REQUEST_TIME}ms${NC}"
echo ""

# Check if cache was set
CACHE_EXISTS=$(redis-cli EXISTS tasks)
if [ "$CACHE_EXISTS" -eq "1" ]; then
    echo -e "${GREEN}✅ Cache was created${NC}"
    
    # Get cache TTL
    TTL=$(redis-cli TTL tasks)
    echo "   Cache TTL: ${TTL} seconds (~$(($TTL / 60)) minutes)"
else
    echo -e "${RED}❌ Cache was not created${NC}"
fi
echo ""

# Second request (should be cache hit)
echo "5️⃣  Second request (should be CACHE HIT)..."
echo "   Watching task-service logs for 'Cache Hit'..."
START_TIME=$(date +%s%N)
curl -s -X GET http://localhost:3002/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN" > /dev/null
END_TIME=$(date +%s%N)
SECOND_REQUEST_TIME=$(( ($END_TIME - $START_TIME) / 1000000 ))
echo -e "${YELLOW}   Response time: ${SECOND_REQUEST_TIME}ms${NC}"
echo ""

# Compare response times
if [ "$SECOND_REQUEST_TIME" -lt "$FIRST_REQUEST_TIME" ]; then
    SPEEDUP=$(( ($FIRST_REQUEST_TIME - $SECOND_REQUEST_TIME) * 100 / $FIRST_REQUEST_TIME ))
    echo -e "${GREEN}✅ Cache hit is faster by ${SPEEDUP}%${NC}"
else
    echo -e "${YELLOW}⚠️  Cache hit was not faster (might be due to small dataset)${NC}"
fi
echo ""

# Create a task (should invalidate cache)
echo "6️⃣  Creating a task (should invalidate cache)..."
curl -s -X POST http://localhost:3002/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Redis Test Task","description":"Testing cache invalidation"}' > /dev/null

# Check if cache was invalidated
CACHE_EXISTS=$(redis-cli EXISTS tasks)
if [ "$CACHE_EXISTS" -eq "0" ]; then
    echo -e "${GREEN}✅ Cache was invalidated after create${NC}"
else
    echo -e "${RED}❌ Cache was not invalidated${NC}"
fi
echo ""

# Third request (should be cache miss again)
echo "7️⃣  Third request (should be CACHE MISS after invalidation)..."
curl -s -X GET http://localhost:3002/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN" > /dev/null

CACHE_EXISTS=$(redis-cli EXISTS tasks)
if [ "$CACHE_EXISTS" -eq "1" ]; then
    echo -e "${GREEN}✅ Cache was recreated${NC}"
else
    echo -e "${RED}❌ Cache was not recreated${NC}"
fi
echo ""

# Redis stats
echo "8️⃣  Redis Statistics:"
echo "   Commands processed: $(redis-cli INFO stats | grep total_commands_processed | cut -d: -f2 | tr -d '\r')"
echo "   Cache hits: $(redis-cli INFO stats | grep keyspace_hits | cut -d: -f2 | tr -d '\r')"
echo "   Cache misses: $(redis-cli INFO stats | grep keyspace_misses | cut -d: -f2 | tr -d '\r')"
echo ""

# Check current keys
echo "9️⃣  Current Redis keys:"
KEYS=$(redis-cli KEYS '*')
if [ -z "$KEYS" ]; then
    echo "   No keys in Redis"
else
    echo "$KEYS" | while read key; do
        TYPE=$(redis-cli TYPE "$key")
        TTL=$(redis-cli TTL "$key")
        echo "   - $key (type: $TYPE, ttl: ${TTL}s)"
    done
fi
echo ""

echo "=========================="
echo -e "${GREEN}✅ Redis integration test complete!${NC}"
echo ""
echo "📝 Check the task-service terminal for 'Cache Hit' and 'Cache Miss' logs"
