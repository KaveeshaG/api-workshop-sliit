import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Redis from 'ioredis';

const router = express.Router();

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
});

router.get('/', async (req: Request, res: Response) => {
    try {
        // Check MongoDB connection
        const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

        // Check Redis connection
        let redisStatus = 'disconnected';
        try {
            await redis.ping();
            redisStatus = 'connected';
        } catch (error) {
            redisStatus = 'disconnected';
        }

        const health = {
            status: (mongoStatus === 'connected' && redisStatus === 'connected') ? 'healthy' : 'unhealthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            service: 'task-service',
            version: '1.0.0',
            services: {
                mongodb: mongoStatus,
                redis: redisStatus
            }
        };

        const statusCode = health.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(health);
    } catch (error: any) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

export default router;
