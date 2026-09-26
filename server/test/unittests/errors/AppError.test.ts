import { describe, expect, it } from 'vitest';
import { AppError, AuthenticationError, ConflictError, ValidationError } from '../../../src/errors/AppError';

describe('AppError', () => {
    it('keeps the message and status code it was created with', () => {
        const error = new AppError('Something went wrong', 418);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(AppError);
        expect(error.message).toBe('Something went wrong');
        expect(error.statusCode).toBe(418);
    });

    it('captures a stack trace pointing at the constructor', () => {
        const error = new AppError('boom', 500);

        expect(error.stack).toBeDefined();
        expect(error.stack).toContain('AppError');
    });
});

describe('ValidationError', () => {
    it('defaults to 400 with the default message', () => {
        const error = new ValidationError();

        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Invalid input data');
    });

    it('accepts a custom message', () => {
        const error = new ValidationError('Username must be at least 3 characters');

        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Username must be at least 3 characters');
    });
});

describe('ConflictError', () => {
    it('defaults to 409 with the default message', () => {
        const error = new ConflictError();

        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(409);
        expect(error.message).toBe('Resource conflict occurred');
    });

    it('accepts a custom message', () => {
        const error = new ConflictError('Username is already taken');

        expect(error.statusCode).toBe(409);
        expect(error.message).toBe('Username is already taken');
    });
});

describe('AuthenticationError', () => {
    it('defaults to 401 with the default message', () => {
        const error = new AuthenticationError();

        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('Invalid username or password');
    });

    it('accepts a custom message', () => {
        const error = new AuthenticationError('Not authenticated');

        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('Not authenticated');
    });
});
