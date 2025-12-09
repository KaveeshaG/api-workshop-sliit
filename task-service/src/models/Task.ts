import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
    title: string;
    description?: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
    assignedTo?: string;
    metadata: {
        createdBy: string;
        updatedBy: string;
        createdAt: Date;
        updatedAt: Date;
    };
}

const taskSchema: Schema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    status: {
        type: String,
        default: 'OPEN',
        enum: ['OPEN', 'IN_PROGRESS', 'DONE']
    },
    assignedTo: {
        type: String
    },
    metadata: {
        createdBy: {
            type: String,
            required: true
        },
        updatedBy: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }
});

export default mongoose.model<ITask>('Task', taskSchema);

