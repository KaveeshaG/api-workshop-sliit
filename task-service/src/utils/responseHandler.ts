import { Response } from 'express';

export const successResponse = (
    res: Response,
    data: any,
    message: string = 'Success',
    statusCode: number = 200,
    pagination?: any
) => {
    const response: any = {
        success: true,
        message,
        data
    };

    if (pagination) {
        response.pagination = pagination;
    }

    return res.status(statusCode).json(response);
};

export const errorResponse = (
    res: Response,
    message: string = 'Error',
    statusCode: number = 500,
    error?: any
) => {
    return res.status(statusCode).json({
        success: false,
        message,
        ...(error && { error })
    });
};
