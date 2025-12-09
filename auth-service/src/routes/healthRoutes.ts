import express, { Request, Response } from 'express';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        // Check MongoDB connection
        const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

        const health = {
            status: mongoStatus === 'connected' ? 'healthy' : 'unhealthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            service: 'auth-service',
            version: '1.0.0',
            services: {
                mongodb: mongoStatus
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
