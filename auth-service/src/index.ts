import express, { Request, Response } from 'express';
import cors from 'cors';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';

const app = express();
connectDB();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);

app.get('/', (req: Request, res: Response) => {
    res.send('Auth Service is running');
});

app.listen(PORT, () => {
    console.log(`Auth Service running on port ${PORT}`);
});
