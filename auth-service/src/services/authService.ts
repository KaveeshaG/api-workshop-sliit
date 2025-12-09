import User, { IUser } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as refreshTokenService from './refreshTokenService';

interface RegisterData {
    username: string;
    password: string;
    role?: string;
}

interface LoginData {
    username: string;
    password: string;
}

interface AuthResult {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        username: string;
        role: string;
    };
}

/**
 * Register a new user
 */
export const registerUser = async (data: RegisterData): Promise<AuthResult> => {
    const { username, password, role } = data;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        throw new Error('Username already exists');
    }

    // Create new user (password will be hashed by pre-save hook)
    const user = await User.create({
        username,
        password,
        role: role || 'User'
    });

    // Generate tokens
    const tokens = await generateTokens(user);

    return {
        ...tokens,
        user: {
            id: user._id.toString(),
            username: user.username,
            role: user.role
        }
    };
};

/**
 * Login user
 */
export const loginUser = async (data: LoginData): Promise<AuthResult> => {
    const { username, password } = data;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
        throw new Error('Invalid credentials');
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    // Generate tokens
    const tokens = await generateTokens(user);

    return {
        ...tokens,
        user: {
            id: user._id.toString(),
            username: user.username,
            role: user.role
        }
    };
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
}> => {
    // Verify refresh token
    const userData = await refreshTokenService.verifyRefreshToken(refreshToken);

    if (!userData) {
        throw new Error('Invalid or expired refresh token');
    }

    // Get user from database
    const user = await User.findById(userData.userId);
    if (!user) {
        throw new Error('User not found');
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    // Rotate refresh token
    const newRefreshToken = await refreshTokenService.rotateRefreshToken(
        refreshToken,
        user._id.toString(),
        user.username
    );

    return {
        accessToken,
        refreshToken: newRefreshToken
    };
};

/**
 * Logout user
 */
export const logoutUser = async (refreshToken: string): Promise<void> => {
    if (refreshToken) {
        await refreshTokenService.deleteRefreshToken(refreshToken);
    }
};

/**
 * Logout user from all devices
 */
export const logoutUserFromAllDevices = async (userId: string): Promise<void> => {
    await refreshTokenService.deleteAllUserRefreshTokens(userId);
};

/**
 * Helper: Generate access and refresh tokens
 */
async function generateTokens(user: IUser): Promise<{
    accessToken: string;
    refreshToken: string;
}> {
    // Generate access token (short-lived)
    const accessToken = generateAccessToken(user);

    // Generate refresh token (long-lived)
    const refreshToken = refreshTokenService.generateRefreshToken();
    await refreshTokenService.storeRefreshToken(
        refreshToken,
        user._id.toString(),
        user.username
    );

    return { accessToken, refreshToken };
}

/**
 * Helper: Generate access token
 */
function generateAccessToken(user: IUser): string {
    return jwt.sign(
        {
            userId: user._id,
            username: user.username,
            role: user.role
        },
        process.env.JWT_SECRET || 'supersecretkey',
        { expiresIn: '15m' }
    );
}
