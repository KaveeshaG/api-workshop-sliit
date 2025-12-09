import request from 'supertest';
import express from 'express';
import authRoutes from '../src/routes/authRoutes';

// Mock Redis - use factory function
jest.mock('ioredis', () => {
    const mockGet = jest.fn().mockResolvedValue(null);
    const mockSet = jest.fn().mockResolvedValue('OK');
    const mockDel = jest.fn().mockResolvedValue(1);
    const mockKeys = jest.fn().mockResolvedValue([]);
    const mockPing = jest.fn().mockResolvedValue('PONG');
    const mockOn = jest.fn();

    return jest.fn().mockImplementation(() => ({
        get: mockGet,
        set: mockSet,
        del: mockDel,
        keys: mockKeys,
        ping: mockPing,
        on: mockOn
    }));
});

// Mock Mongoose Model
jest.mock('../src/models/User', () => {
    const mockUser = jest.fn();
    (mockUser as any).findOne = jest.fn();
    (mockUser as any).findById = jest.fn();
    (mockUser as any).create = jest.fn();
    return mockUser;
});

// Mock DB Connection
jest.mock('../src/config/db', () => jest.fn());

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashedpassword'),
    compare: jest.fn().mockResolvedValue(true),
    genSalt: jest.fn().mockResolvedValue('salt')
}));

import User from '../src/models/User';
import Redis from 'ioredis';

// Get the mocked Redis instance
const redis = new Redis();

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);

describe('Auth Service API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/v1/auth/register', () => {
        it('should register a new user', async () => {
            (User as any).findOne.mockResolvedValue(null);
            (User as any).create.mockResolvedValue({
                _id: '123',
                username: 'testuser',
                password: 'hashedpassword',
                role: 'User',
                save: jest.fn()
            });

            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    username: 'testuser',
                    password: 'password123',
                    role: 'User'
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('accessToken');
            expect(res.body.data).toHaveProperty('refreshToken');
            expect(res.body.data).toHaveProperty('user');
            expect(res.body.data.user.username).toBe('testuser');
        });

        it('should reject duplicate username', async () => {
            (User as any).findOne.mockResolvedValue({
                _id: '123',
                username: 'testuser',
                role: 'User'
            });

            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    username: 'testuser',
                    password: 'password123',
                    role: 'User'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('already exists');
        });

        it('should reject invalid input', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    username: 'ab', // Too short
                    password: 'pass',
                    role: 'User'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('should login with valid credentials', async () => {
            (User as any).findOne.mockResolvedValue({
                _id: '123',
                username: 'testuser',
                password: 'hashedpassword',
                role: 'User'
            });

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    username: 'testuser',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('accessToken');
            expect(res.body.data).toHaveProperty('refreshToken');
            expect(res.body.data.user.username).toBe('testuser');
        });

        it('should reject invalid credentials', async () => {
            (User as any).findOne.mockResolvedValue(null);

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    username: 'testuser',
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/auth/refresh', () => {
        it('should refresh access token with valid refresh token', async () => {
            // Mock Redis to return user data
            (redis.get as jest.Mock).mockResolvedValueOnce(
                JSON.stringify({ userId: '123', username: 'testuser' })
            );

            (User as any).findById.mockResolvedValue({
                _id: '123',
                username: 'testuser',
                password: 'hashedpassword',
                role: 'User'
            });

            const res = await request(app)
                .post('/api/v1/auth/refresh')
                .send({
                    refreshToken: 'valid-refresh-token'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('accessToken');
            expect(res.body.data).toHaveProperty('refreshToken');
        });

        it('should reject invalid refresh token', async () => {
            (redis.get as jest.Mock).mockResolvedValueOnce(null);

            const res = await request(app)
                .post('/api/v1/auth/refresh')
                .send({
                    refreshToken: 'invalid-token'
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body.success).toBe(false);
        });

        it('should require refresh token', async () => {
            const res = await request(app)
                .post('/api/v1/auth/refresh')
                .send({});

            expect(res.statusCode).toEqual(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/auth/logout', () => {
        it('should logout successfully', async () => {
            const res = await request(app)
                .post('/api/v1/auth/logout')
                .send({
                    refreshToken: 'some-token'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('Logged out');
        });
    });
});
