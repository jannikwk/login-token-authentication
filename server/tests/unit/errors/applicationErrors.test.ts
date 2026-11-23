import { describe, expect, it } from 'vitest';
import {
    ApplicationError,
    InvalidCredentialsError,
    InvalidInputError,
    InvalidTokenError,
    UnauthenticatedError,
    UserNotFoundError,
    UsernameAlreadyExistsError,
} from '../../../src/errors/applicationErrors';

describe('ApplicationError', () => {
    it('provides a shared error contract without an HTTP status code', () => {
        const error = new InvalidInputError('Something went wrong');

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('Something went wrong');
        expect(error.code).toBe('INVALID_INPUT');
        expect(error).not.toHaveProperty('statusCode');
    });

    it('captures a stack trace pointing at the constructor', () => {
        const error = new InvalidInputError('boom');

        expect(error.stack).toBeDefined();
        expect(error.stack).toContain('InvalidInputError');
    });
});

describe.each([
    [InvalidInputError, 'INVALID_INPUT', 'Invalid input data'],
    [UsernameAlreadyExistsError, 'USERNAME_ALREADY_EXISTS', 'Username is already taken'],
    [InvalidCredentialsError, 'INVALID_CREDENTIALS', 'Invalid username or password'],
    [InvalidTokenError, 'INVALID_TOKEN', 'Invalid or expired token'],
    [UnauthenticatedError, 'UNAUTHENTICATED', 'Not authenticated'],
    [UserNotFoundError, 'USER_NOT_FOUND', 'User not found'],
])('%s', (ErrorClass, code, defaultMessage) => {
    it('uses its application code and default message', () => {
        const error = new ErrorClass();

        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.code).toBe(code);
        expect(error.message).toBe(defaultMessage);
    });

    it('accepts a custom message', () => {
        const error = new ErrorClass('A custom error message');

        expect(error.code).toBe(code);
        expect(error.message).toBe('A custom error message');
    });
});
