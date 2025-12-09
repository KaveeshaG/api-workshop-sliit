import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    username: string;
    password: string;
    role: 'Manager' | 'User' | 'Employee' | 'Admin';
    createdAt?: Date;
    updatedAt?: Date;
}

const userSchema: Schema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['Manager', 'User', 'Employee', 'Admin']
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }

    try {
        // Generate salt and hash password
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password as string, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

export default mongoose.model<IUser>('User', userSchema);
