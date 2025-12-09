import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { SECRET_KEY } from '../middleware/authMiddleware';

export const registerUser = async (username: string, password: string, role: string): Promise<IUser> => {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, role });
    return await user.save();
};

export const loginUser = async (username: string, password: string): Promise<{ token: string; role: string }> => {
    const user = await User.findOne({ username });
    if (!user) {
        throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    return { token, role: user.role };
};
