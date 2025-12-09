import request from 'supertest';
import express from 'express';
import taskRoutes from '../src/routes/taskRoutes';

// Mock Redis
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1)
    }));
});

// Mock Mongoose Model
jest.mock('../src/models/Task', () => {
    const mockTask = jest.fn();
    (mockTask as any).find = jest.fn();
    (mockTask as any).findByIdAndUpdate = jest.fn();
    return mockTask;
});

// Mock DB Connection
jest.mock('../src/config/db', () => jest.fn());

import Task from '../src/models/Task';

const app = express();
app.use(express.json());
app.use('/api/v1/tasks', taskRoutes);

describe('Task Service API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new task', async () => {
        (Task as unknown as jest.Mock).mockImplementation(() => ({
            save: jest.fn().mockResolvedValue({
                title: 'New Task',
                description: 'Test Description',
                assignedTo: 'User1',
                status: 'OPEN'
            })
        }));


        const res = await request(app)
            .post('/api/v1/tasks')
            .send({
                title: 'New Task',
                description: 'Test Description',
                assignedTo: 'User1'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toHaveProperty('title', 'New Task');
    });

    it('should fetch tasks', async () => {
        (Task as any).find.mockResolvedValue([]);

        const res = await request(app).get('/api/v1/tasks');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(Array.isArray(res.body.data)).toBeTruthy();
    });

});
