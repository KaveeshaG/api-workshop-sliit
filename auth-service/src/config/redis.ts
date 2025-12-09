import Redis from 'ioredis';

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
});

redis.on('connect', () => {
    console.log('Redis connected successfully');
});

redis.on('error', (error: Error) => {
    console.error('Redis connection error:', error);
});

export default redis;
