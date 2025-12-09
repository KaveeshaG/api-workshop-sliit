import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
    title: string;
    description?: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
    assignedTo?: string;
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
    }
});

export default mongoose.model<ITask>('Task', taskSchema);
