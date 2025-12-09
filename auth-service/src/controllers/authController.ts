import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import * as refreshTokenService from '../services/refreshTokenService';

// Register new user
export const register = async (req: Request, res: Response) => {
    try {
        const { username, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }

        // Create new user (password will be hashed by pre-save hook)
        const user = await User.create({
            username,
            password,
            role: role || 'User'
        });

        // Generate access token (short-lived)
        const accessToken = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET || 'supersecretkey',
            { expiresIn: '15m' } // Short expiry for access token
        );

        // Generate refresh token (long-lived)
        const refreshToken = refreshTokenService.generateRefreshToken();
        await refreshTokenService.storeRefreshToken(
            refreshToken,
            user._id.toString(),
            user.username
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user._id,
                    username: user.username,
                    role: user.role
                }
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Login user
export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password || '');
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate access token (short-lived)
        const accessToken = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET || 'supersecretkey',
            { expiresIn: '15m' } // Short expiry for access token
        );

        // Generate refresh token (long-lived)
        const refreshToken = refreshTokenService.generateRefreshToken();
        await refreshTokenService.storeRefreshToken(
            refreshToken,
            user._id.toString(),
            user.username
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user._id,
                    username: user.username,
                    role: user.role
                }
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Refresh access token
export const refresh = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify refresh token
        const userData = await refreshTokenService.verifyRefreshToken(refreshToken);

        if (!userData) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        }

        // Get user from database
        const user = await User.findById(userData.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate new access token
        const accessToken = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET || 'supersecretkey',
            { expiresIn: '15m' }
        );

        // Rotate refresh token (optional but recommended for security)
        const newRefreshToken = await refreshTokenService.rotateRefreshToken(
            refreshToken,
            user._id.toString(),
            user.username
        );

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Logout
export const logout = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            await refreshTokenService.deleteRefreshToken(refreshToken);
        }

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

// Logout from all devices
export const logoutAll = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        await refreshTokenService.deleteAllUserRefreshTokens(user.userId);

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
