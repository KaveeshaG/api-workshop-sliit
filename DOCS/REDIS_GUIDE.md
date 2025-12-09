# Redis Integration Guide

Both `auth-service` and `task-service` now support Redis for caching and session management.

## Configuration

Redis connection is configured via environment variables in `.env`:

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Usage in Auth Service

### Import Redis Client

```typescript
import redis from '../config/redis';
```

### Example: Cache User Session

```typescript
// Set session with 1 hour expiry
await redis.set(`session:${userId}`, JSON.stringify(userData), 'EX', 3600);

// Get session
const session = await redis.get(`session:${userId}`);
if (session) {
    const userData = JSON.parse(session);
}

// Delete session (logout)
await redis.del(`session:${userId}`);
```

### Example: Rate Limiting

```typescript
const key = `rate_limit:${userId}`;
const count = await redis.incr(key);

if (count === 1) {
    await redis.expire(key, 60); // 60 seconds window
}

if (count > 10) {
    throw new Error('Rate limit exceeded');
}
```

## Usage in Task Service

Task service already uses Redis for caching tasks. See `src/services/taskService.ts`:

```typescript
// Cache tasks with 1 hour expiry
await redis.set('tasks', JSON.stringify(tasks), 'EX', 3600);

// Invalidate cache on updates
await redis.del('tasks');
```

## Common Redis Operations

### String Operations
```typescript
await redis.set('key', 'value');
await redis.get('key');
await redis.del('key');
await redis.setex('key', 3600, 'value'); // with expiry
```

### Hash Operations
```typescript
await redis.hset('user:123', 'name', 'John');
await redis.hget('user:123', 'name');
await redis.hgetall('user:123');
```

### List Operations
```typescript
await redis.lpush('queue', 'item');
await redis.rpop('queue');
await redis.lrange('queue', 0, -1);
```

### Set Operations
```typescript
await redis.sadd('tags', 'nodejs', 'redis');
await redis.smembers('tags');
await redis.sismember('tags', 'nodejs');
```

## Docker Setup

Redis is automatically started with docker-compose:

```bash
docker-compose up -d redis
```

Access Redis CLI:
```bash
docker exec -it redis redis-cli
```

## Local Development

Start Redis locally:
```bash
# macOS with Homebrew
brew install redis
brew services start redis

# Or with Docker
docker run -d -p 6379:6379 redis:7-alpine
```
