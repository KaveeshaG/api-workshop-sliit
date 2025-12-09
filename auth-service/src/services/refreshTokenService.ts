import crypto from 'crypto';
import redis from '../config/redis';

const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Generate a secure random refresh token
 */
export const generateRefreshToken = (): string => {
    return crypto.randomBytes(64).toString('hex');
};

/**
 * Store refresh token in Redis
 * Key format: refresh_token:{token}
 * Value: userId
 */
export const storeRefreshToken = async (
    token: string,
    userId: string,
    username: string
): Promise<void> => {
    const key = `refresh_token:${token}`;
    const value = JSON.stringify({ userId, username });

    await redis.set(key, value, 'EX', REFRESH_TOKEN_EXPIRY);
};

/**
 * Verify and retrieve user info from refresh token
 */
export const verifyRefreshToken = async (
    token: string
): Promise<{ userId: string; username: string } | null> => {
    const key = `refresh_token:${token}`;
    const value = await redis.get(key);

    if (!value) {
        return null;
    }

    return JSON.parse(value);
};

/**
 * Delete refresh token (logout)
 */
export const deleteRefreshToken = async (token: string): Promise<void> => {
    const key = `refresh_token:${token}`;
    await redis.del(key);
};

/**
 * Delete all refresh tokens for a user (logout from all devices)
 */
export const deleteAllUserRefreshTokens = async (userId: string): Promise<void> => {
    const pattern = 'refresh_token:*';
    const keys = await redis.keys(pattern);

    for (const key of keys) {
        const value = await redis.get(key);
        if (value) {
            const data = JSON.parse(value);
            if (data.userId === userId) {
                await redis.del(key);
            }
        }
    }
};

/**
 * Rotate refresh token (invalidate old, create new)
 */
export const rotateRefreshToken = async (
    oldToken: string,
    userId: string,
    username: string
): Promise<string> => {
    // Delete old token
    await deleteRefreshToken(oldToken);

    // Generate and store new token
    const newToken = generateRefreshToken();
    await storeRefreshToken(newToken, userId, username);

    return newToken;
};
