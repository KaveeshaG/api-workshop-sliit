import { Request, Response } from 'express';
import * as authService from '../services/authService';

/**
 * Register new user
 */
export const register = async (req: Request, res: Response) => {
    try {
        const { username, password, role } = req.body;

        const result = await authService.registerUser({
            username,
            password,
            role
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: result
        });
    } catch (error: any) {
        if (error.message === 'Username already exists') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        const result = await authService.loginUser({
            username,
            password
        });

        res.json({
            success: true,
            message: 'Login successful',
            data: result
        });
    } catch (error: any) {
        if (error.message === 'Invalid credentials') {
            return res.status(401).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Refresh access token
 */
export const refresh = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        const result = await authService.refreshAccessToken(refreshToken);

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: result
        });
    } catch (error: any) {
        if (error.message === 'Invalid or expired refresh token' || error.message === 'User not found') {
            return res.status(401).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Logout
 */
export const logout = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        await authService.logoutUser(refreshToken);

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Logout from all devices
 */
export const logoutAll = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        await authService.logoutUserFromAllDevices(user.userId);

        res.json({
            success: true,
            message: 'Logged out from all devices successfully'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
