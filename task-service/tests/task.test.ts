import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import taskRoutes from '../src/routes/taskRoutes';

// Mock Redis
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        keys: jest.fn().mockResolvedValue([])
    }));
});

// Mock Mongoose Model
jest.mock('../src/models/Task', () => {
    const mockTask = jest.fn();
    (mockTask as any).find = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue([])
            })
        })
    });
    (mockTask as any).countDocuments = jest.fn().mockResolvedValue(0);
    (mockTask as any).findByIdAndUpdate = jest.fn();
    (mockTask as any).findByIdAndDelete = jest.fn();
    return mockTask;
});

// Mock DB Connection
jest.mock('../src/config/db', () => jest.fn());

import Task from '../src/models/Task';

const app = express();
app.use(express.json());
app.use('/api/v1/tasks', taskRoutes);

// Helper function to generate test token
const generateTestToken = () => {
    return jwt.sign(
        {
            userId: 'test-user-id',
            username: 'testuser',
            role: 'User'
        },
        process.env.JWT_SECRET || 'supersecretkey',
        { expiresIn: '1h' }
    );
};

describe('Task Service API', () => {
    let authToken: string;

    beforeAll(() => {
        authToken = generateTestToken();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/v1/tasks', () => {
        it('should create a new task with valid token', async () => {
            const mockTask = {
                _id: 'task-123',
                title: 'New Task',
                description: 'Test Description',
                assignedTo: 'User1',
                status: 'OPEN',
                metadata: {
                    createdBy: 'testuser',
                    updatedBy: 'testuser',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            };

            (Task as unknown as jest.Mock).mockImplementation(() => ({
                save: jest.fn().mockResolvedValue(mockTask)
            }));

            const res = await request(app)
                .post('/api/v1/tasks')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'New Task',
                    description: 'Test Description',
                    assignedTo: 'User1'
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('title', 'New Task');
        });

        it('should reject request without token', async () => {
            const res = await request(app)
                .post('/api/v1/tasks')
                .send({
                    title: 'New Task',
                    description: 'Test Description'
                });

            expect(res.statusCode).toEqual(403);
            expect(res.body).toHaveProperty('success', false);
        });

        it('should reject request with invalid data', async () => {
            const res = await request(app)
                .post('/api/v1/tasks')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: '', // Invalid: empty title
                    description: 'Test Description'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('success', false);
        });
    });

    describe('GET /api/v1/tasks', () => {
        it('should fetch tasks with valid token', async () => {
            const mockTasks = [
                {
                    _id: 'task-1',
                    title: 'Task 1',
                    status: 'OPEN',
                    metadata: {
                        createdBy: 'testuser',
                        updatedBy: 'testuser',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                }
            ];

            (Task as any).find.mockReturnValue({
                skip: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({
                        sort: jest.fn().mockResolvedValue(mockTasks)
                    })
                })
            });
            (Task as any).countDocuments.mockResolvedValue(1);

            const res = await request(app)
                .get('/api/v1/tasks')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('pagination');
            expect(Array.isArray(res.body.data)).toBeTruthy();
        });

        it('should reject request without token', async () => {
            const res = await request(app).get('/api/v1/tasks');

            expect(res.statusCode).toEqual(403);
            expect(res.body).toHaveProperty('success', false);
        });

        it('should support pagination parameters', async () => {
            (Task as any).find.mockReturnValue({
                skip: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({
                        sort: jest.fn().mockResolvedValue([])
                    })
                })
            });
            (Task as any).countDocuments.mockResolvedValue(0);

            const res = await request(app)
                .get('/api/v1/tasks?page=2&limit=5')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.pagination).toHaveProperty('page');
            expect(res.body.pagination).toHaveProperty('limit');
            expect(res.body.pagination).toHaveProperty('total', 0);
            expect(res.body.pagination).toHaveProperty('pages', 0);
        });
    });

    describe('PUT /api/v1/tasks/:id', () => {
        it('should update task with valid token', async () => {
            const mockUpdatedTask = {
                _id: 'task-123',
                title: 'Updated Task',
                status: 'DONE',
                metadata: {
                    createdBy: 'testuser',
                    updatedBy: 'testuser',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            };

            (Task as any).findByIdAndUpdate.mockResolvedValue(mockUpdatedTask);

            const res = await request(app)
                .put('/api/v1/tasks/task-123')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ status: 'DONE' });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('status', 'DONE');
        });

        it('should return 404 for non-existent task', async () => {
            (Task as any).findByIdAndUpdate.mockResolvedValue(null);

            const res = await request(app)
                .put('/api/v1/tasks/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ status: 'DONE' });

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('success', false);
        });
    });

    describe('DELETE /api/v1/tasks/:id', () => {
        it('should delete task with valid token', async () => {
            const mockDeletedTask = {
                _id: 'task-123',
                title: 'Deleted Task',
                status: 'OPEN'
            };

            (Task as any).findByIdAndDelete.mockResolvedValue(mockDeletedTask);

            const res = await request(app)
                .delete('/api/v1/tasks/task-123')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'Task deleted successfully');
        });

        it('should return 404 for non-existent task', async () => {
            (Task as any).findByIdAndDelete.mockResolvedValue(null);

            const res = await request(app)
                .delete('/api/v1/tasks/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('success', false);
        });

        it('should reject delete without token', async () => {
            const res = await request(app)
                .delete('/api/v1/tasks/task-123');

            expect(res.statusCode).toEqual(403);
            expect(res.body).toHaveProperty('success', false);
        });
    });
});
