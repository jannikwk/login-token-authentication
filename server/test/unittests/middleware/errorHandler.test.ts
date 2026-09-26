import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../../../src/middleware/errorHandler';
import { AppError, ConflictError } from '../../../src/errors/AppError';

const createResponse = () => {
    const res = {
        status: vi.fn(),
        json: vi.fn(),
        err: undefined as unknown,
    };
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);
    return res;
};

type MockResponse = ReturnType<typeof createResponse>;

describe('errorHandler middleware', () => {
    let log: { warn: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
    let req: Request;
    let res: MockResponse;
    let next: NextFunction;

    beforeEach(() => {
        log = { warn: vi.fn(), error: vi.fn() };
        req = { log } as unknown as Request;
        res = createResponse();
        next = vi.fn();
    });

    it('responds with the status code and message of an AppError', () => {
        const error = new ConflictError('Username is already taken');

        errorHandler(error, req, res as unknown as Response, next);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ message: 'Username is already taken' });
        expect(log.warn).toHaveBeenCalledWith(
            { statusCode: 409, message: 'Username is already taken' },
            'Request failed with application error'
        );
        expect(log.error).not.toHaveBeenCalled();
        expect(res.err).toBe(error);
        expect(next).not.toHaveBeenCalled();
    });

    it('responds with 500 and logs an unhandled Error', () => {
        const error = new Error('boom');

        errorHandler(error, req, res as unknown as Response, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
        expect(log.error).toHaveBeenCalledWith(
            { message: 'boom', stack: error.stack },
            'Unhandled request error'
        );
        expect(log.warn).not.toHaveBeenCalled();
        expect(res.err).toBe(error);
    });

    it('responds with 500 for a thrown non-Error value', () => {
        errorHandler('just a string', req, res as unknown as Response, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
        expect(log.error).toHaveBeenCalledWith('Unknown error occurred');
        expect(log.warn).not.toHaveBeenCalled();
        expect(res.err).toBeInstanceOf(Error);
        expect((res.err as Error).message).toBe('Internal server error');
    });

    it('works for an AppError created without a subclass', () => {
        const error = new AppError('Teapot', 418);

        errorHandler(error, req, res as unknown as Response, next);

        expect(res.status).toHaveBeenCalledWith(418);
        expect(res.json).toHaveBeenCalledWith({ message: 'Teapot' });
    });
});
