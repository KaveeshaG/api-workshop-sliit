import request from 'supertest';
import express from 'express';
import authRoutes from '../src/routes/authRoutes';

// Mock Mongoose Model
jest.mock('../src/models/User', () => {
    const mockUser = jest.fn();
    (mockUser as any).findOne = jest.fn();
    return mockUser;
});

// Mock DB Connection
jest.mock('../src/config/db', () => jest.fn());

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashedpassword'),
    compare: jest.fn().mockResolvedValue(true)
}));

import User from '../src/models/User';

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);

describe('Auth Service API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should register a new user', async () => {
        (User as any).findOne.mockResolvedValue(null);
        (User as unknown as jest.Mock).mockImplementation(() => ({
            save: jest.fn().mockResolvedValue({
                id: '123',
                _id: '123',
                username: 'testuser',
                role: 'User'
            })
        }));

        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                username: 'testuser',
                password: 'password123',
                role: 'User'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toHaveProperty('user');
    });

    it('should login the user', async () => {
        (User as any).findOne.mockResolvedValue({
            id: '123',
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
        expect(res.body.data).toHaveProperty('token');
    });
});
