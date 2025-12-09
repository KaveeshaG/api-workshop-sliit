import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db';
import taskRoutes from './routes/taskRoutes';
import healthRoutes from './routes/healthRoutes';

const app = express();
connectDB();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Routes
app.use('/health', healthRoutes);
app.use('/api/v1/tasks', taskRoutes);

app.get('/', (req: Request, res: Response) => {
    res.send('Task Service is running');
});

app.listen(PORT, () => {
    console.log(`Task Service running on port ${PORT}`);
});
