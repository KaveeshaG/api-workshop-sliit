import { Response } from 'express';

export const successResponse = (res: Response, data: any, message: string = 'Success', statusCode: number = 200): void => {
    res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

export const errorResponse = (res: Response, message: string = 'Error', statusCode: number = 500, error: any = null): void => {
    res.status(statusCode).json({
        success: false,
        message,
        error
    });
};
