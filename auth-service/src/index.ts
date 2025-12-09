import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import healthRoutes from './routes/healthRoutes';

const app = express();
connectDB();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: 'Too many login attempts, please try again later.'
});

app.use('/api/', limiter);
app.use('/api/', authLimiter);

// Routes
app.use('/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);

app.get('/', (req: Request, res: Response) => {
    res.send('Auth Service is running');
});

app.listen(PORT, () => {
    console.log(`Auth Service running on port ${PORT}`);
});
