import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireAuth } from '../../../src/middleware/requireAuth';
import { signToken } from '../../../src/utils/jwt';
import { AuthenticationError } from '../../../src/errors/AppError';

const testUser = {
    id: '0192c9f4-0000-7000-8000-000000000000',
    username: 'alice',
};

describe('requireAuth middleware', () => {
    let next: NextFunction;

    beforeEach(() => {
        next = vi.fn();
    });

    const requestWithCookies = (cookies?: Record<string, string>) => {
        const req = { cookies } as unknown as Request & { userId?: string };
        return req;
    };

    it('throws an AuthenticationError when the token cookie is missing', () => {
        const req = requestWithCookies(undefined);

        expect(() => requireAuth(req, {} as Response, next))
            .toThrow(new AuthenticationError('Not authenticated'));
        expect(next).not.toHaveBeenCalled();
    });

    it('throws an AuthenticationError when the token cookie is empty', () => {
        const req = requestWithCookies({});

        expect(() => requireAuth(req, {} as Response, next))
            .toThrow(new AuthenticationError('Not authenticated'));
        expect(next).not.toHaveBeenCalled();
    });

    it('throws an AuthenticationError for a malformed token', () => {
        const req = requestWithCookies({ token: 'not-a-valid-token' });

        expect(() => requireAuth(req, {} as Response, next))
            .toThrow(new AuthenticationError('Invalid or expired token'));
        expect(next).not.toHaveBeenCalled();
    });

    it('populates req.userId and calls next for a valid token', () => {
        const token = signToken(testUser);
        const req = requestWithCookies({ token });

        requireAuth(req, {} as Response, next);

        expect(req.userId).toBe(testUser.id);
        expect(next).toHaveBeenCalledOnce();
    });
});
