import Redis from 'ioredis';
import Task, { ITask } from '../models/Task';

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
});

export const getTasks = async (page: number = 1, limit: number = 20, filters: any = {}): Promise<{ tasks: ITask[], pagination: any }> => {
    const cacheKey = `tasks:${page}:${limit}:${JSON.stringify(filters)}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        console.log('Cache Hit');
        return JSON.parse(cachedData);
    }

    console.log('Cache Miss');

    // Build query
    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.assignedTo) query.assignedTo = filters.assignedTo;

    // Calculate skip
    const skip = (page - 1) * limit;

    // Get tasks with pagination
    const tasks = await Task.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ 'metadata.createdAt': -1 });

    // Get total count
    const total = await Task.countDocuments(query);

    const result = {
        tasks,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };

    // Update cache
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600); // 1 hour expiry
    return result;
};

export const createTask = async (taskData: Partial<ITask>): Promise<ITask> => {
    const task = new Task({
        ...taskData,
        status: 'OPEN'
    });
    const newTask = await task.save();

    // Invalidate all task caches
    const keys = await redis.keys('tasks:*');
    if (keys.length > 0) {
        await redis.del(...keys);
    }

    return newTask;
};

export const updateTask = async (id: string, status: string, updatedBy: string): Promise<ITask | null> => {
    const updatedTask = await Task.findByIdAndUpdate(
        id,
        {
            status,
            'metadata.updatedBy': updatedBy,
            'metadata.updatedAt': new Date()
        },
        { new: true }
    );

    if (updatedTask) {
        // Invalidate all task caches
        const keys = await redis.keys('tasks:*');
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    }

    return updatedTask;
};
