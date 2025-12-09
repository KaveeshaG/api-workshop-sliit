import { z } from 'zod';

// Create task validation schema
export const createTaskSchema = z.object({
    title: z.string()
        .min(1, 'Title is required')
        .max(200, 'Title must not exceed 200 characters'),
    description: z.string()
        .max(1000, 'Description must not exceed 1000 characters')
        .optional(),
    assignedTo: z.string()
        .max(50, 'Assigned to must not exceed 50 characters')
        .optional()
});

// Update task validation schema
export const updateTaskSchema = z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'DONE'])
});

// Query parameters validation
export const queryParamsSchema = z.object({
    page: z.string()
        .regex(/^\d+$/, 'Page must be a positive number')
        .transform(Number)
        .refine(val => val > 0, 'Page must be greater than 0')
        .optional()
        .or(z.literal(undefined))
        .transform(val => val ?? 1),
    limit: z.string()
        .regex(/^\d+$/, 'Limit must be a positive number')
        .transform(Number)
        .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100')
        .optional()
        .or(z.literal(undefined))
        .transform(val => val ?? 20),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'DONE']).optional(),
    assignedTo: z.string().optional()
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type QueryParams = z.infer<typeof queryParamsSchema>;
