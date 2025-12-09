import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    username: string;
    password?: string;
    role: 'Manager' | 'User' | 'Employee' | 'Admin';
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
});

export default mongoose.model<IUser>('User', userSchema);
