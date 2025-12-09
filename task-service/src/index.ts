import express, { Request, Response } from 'express';
import cors from 'cors';
import connectDB from './config/db';
import taskRoutes from './routes/taskRoutes';

const app = express();
connectDB();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/tasks', taskRoutes);

app.get('/', (req: Request, res: Response) => {
    res.send('Task Service is running');
});

app.listen(PORT, () => {
    console.log(`Task Service running on port ${PORT}`);
});
