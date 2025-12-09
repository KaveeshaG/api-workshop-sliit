import { Request, Response } from 'express';
import * as taskService from '../services/taskService';
import { successResponse, errorResponse } from '../utils/responseHandler';

export const getTasks = async (req: Request, res: Response) => {
    try {
        const { page, limit, status, assignedTo } = req.query as any;
        const filters = { status, assignedTo };

        const result = await taskService.getTasks(page, limit, filters);
        successResponse(res, result.tasks, 'Tasks fetched successfully', 200, result.pagination);
    } catch (error: any) {
        errorResponse(res, 'Internal server error', 500, error.message);
    }
};

export const createTask = async (req: Request, res: Response) => {
    try {
        const { title, description, assignedTo } = req.body;
        const user = (req as any).user; // User info from auth middleware

        if (!title) {
            return errorResponse(res, 'Title is required', 400);
        }

        const newTask = await taskService.createTask({
            title,
            description,
            assignedTo,
            metadata: {
                createdBy: user.username,
                updatedBy: user.username,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
        successResponse(res, newTask, 'Task created successfully', 201);
    } catch (error: any) {
        errorResponse(res, 'Internal server error', 500, error.message);
    }
};

export const updateTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const user = (req as any).user;

        const updatedTask = await taskService.updateTask(id, status, user.username);

        if (!updatedTask) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.json({
            success: true,
            message: 'Task updated successfully',
            data: updatedTask
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

export const deleteTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const deletedTask = await taskService.deleteTask(id);

        if (!deletedTask) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.json({
            success: true,
            message: 'Task deleted successfully',
            data: deletedTask
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
