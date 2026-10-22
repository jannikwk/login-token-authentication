import type { Request, Response, NextFunction } from "express";
import { ApplicationError, ApplicationErrorCode } from "../errors/applicationErrors";

const statusCodeByErrorCode: Record<ApplicationErrorCode, number> = {
    INVALID_INPUT: 400,
    USERNAME_ALREADY_EXISTS: 409,
    INVALID_CREDENTIALS: 401,
    INVALID_TOKEN: 401,
    UNAUTHENTICATED: 401,
    USER_NOT_FOUND: 404,
};

export const errorHandler = (error: unknown, req: Request, res: Response, _next: NextFunction) => {
    let statusCode = 500;
    let message = 'Internal server error';

    if (error instanceof ApplicationError) {
        statusCode = statusCodeByErrorCode[error.code];
        message = error.message;

        req.log.warn({ statusCode, message }, 'Request failed with application error');

    } else if (error instanceof Error) {
        req.log.error({ message: error.message, stack: error.stack }, 'Unhandled request error');
    } else {
        req.log.error('Unknown error occurred');
    }

    res.err = error instanceof Error ? error : new Error(message);
    return res.status(statusCode).json({ message });
};