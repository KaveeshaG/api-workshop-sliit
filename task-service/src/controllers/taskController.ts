import { Request, Response } from 'express';
import * as taskService from '../services/taskService';
import { successResponse, errorResponse } from '../utils/responseHandler';

export const getTasks = async (req: Request, res: Response) => {
    try {
        const tasks = await taskService.getTasks();
        successResponse(res, tasks, 'Tasks fetched successfully');
    } catch (error: any) {
        errorResponse(res, 'Internal server error', 500, error.message);
    }
};

export const createTask = async (req: Request, res: Response) => {
    try {
        const { title, description, assignedTo } = req.body;

        if (!title) {
            return errorResponse(res, 'Title is required', 400);
        }

        const newTask = await taskService.createTask({ title, description, assignedTo });
        successResponse(res, newTask, 'Task created successfully', 201);
    } catch (error: any) {
        errorResponse(res, 'Internal server error', 500, error.message);
    }
};

export const updateTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedTask = await taskService.updateTask(id, status);
        if (!updatedTask) {
            return errorResponse(res, 'Task not found', 404);
        }

        successResponse(res, updatedTask, 'Task updated successfully');
    } catch (error: any) {
        errorResponse(res, 'Internal server error', 500, error.message);
    }
};
