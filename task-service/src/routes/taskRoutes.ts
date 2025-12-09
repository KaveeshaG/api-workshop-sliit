import express from 'express';
import { getTasks, createTask, updateTask } from '../controllers/taskController';
import { verifyToken } from '../middleware/authMiddleware';
import { validate, validateQuery } from '../middleware/validation';
import { createTaskSchema, updateTaskSchema, queryParamsSchema } from '../validators/taskValidators';

const router = express.Router();

// All routes require authentication
router.get('/', verifyToken, validateQuery(queryParamsSchema), getTasks);
router.post('/', verifyToken, validate(createTaskSchema), createTask);
router.put('/:id', verifyToken, validate(updateTaskSchema), updateTask);

export default router;
