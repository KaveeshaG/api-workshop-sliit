import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { successResponse, errorResponse } from '../utils/responseHandler';

export const register = async (req: Request, res: Response) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password || !role) {
            return errorResponse(res, 'All fields are required', 400);
        }

        const user = await authService.registerUser(username, password, role);
        successResponse(res, { user: { id: user.id, username: user.username, role: user.role } }, 'User registered successfully', 201);
    } catch (error: any) {
        if (error.message === 'User already exists') {
            return errorResponse(res, error.message, 400);
        }
        errorResponse(res, 'Internal server error', 500, error.message);
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        const result = await authService.loginUser(username, password);
        successResponse(res, result, 'Login successful');
    } catch (error: any) {
        if (error.message === 'Invalid credentials') {
            return errorResponse(res, error.message, 401);
        }
        errorResponse(res, 'Internal server error', 500, error.message);
    }
};
