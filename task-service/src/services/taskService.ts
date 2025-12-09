import Redis from 'ioredis';
import Task, { ITask } from '../models/Task';

const redis = new Redis(); // Defaults to localhost:6379

export const getTasks = async (): Promise<ITask[]> => {
    const cacheKey = 'tasks';
    const cachedTasks = await redis.get(cacheKey);

    if (cachedTasks) {
        console.log('Cache Hit');
        return JSON.parse(cachedTasks);
    }

    console.log('Cache Miss');
    const tasks = await Task.find();

    // Update cache
    await redis.set(cacheKey, JSON.stringify(tasks), 'EX', 3600); // 1 hour expiry
    return tasks;
};

export const createTask = async (taskData: Partial<ITask>): Promise<ITask> => {
    const task = new Task({ ...taskData, status: 'OPEN' });
    const newTask = await task.save();
    await redis.del('tasks'); // Invalidate cache
    return newTask;
};

export const updateTask = async (id: string, status: string): Promise<ITask | null> => {
    const updatedTask = await Task.findByIdAndUpdate(id, { status }, { new: true });
    if (updatedTask) {
        await redis.del('tasks'); // Invalidate cache
    }
    return updatedTask;
};
