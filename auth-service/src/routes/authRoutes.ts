import express from 'express';
import { register, login, refresh, logout, logoutAll } from '../controllers/authController';
import { validate } from '../middleware/validation';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/authValidators';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refresh);
router.post('/logout', validate(refreshTokenSchema), logout);
router.post('/logout-all', verifyToken, logoutAll);

export default router;
