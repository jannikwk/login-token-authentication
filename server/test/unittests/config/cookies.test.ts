import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import {
    TOKEN_COOKIE,
    TOKEN_COOKIE_OPTIONS,
    clearTokenCookie,
    setTokenCookie,
} from '../../../src/config/cookies';
import { env } from '../../../src/config/env';

const createResponse = () => {
    const res = {
        cookie: vi.fn(),
        clearCookie: vi.fn(),
    };
    res.cookie.mockReturnValue(res);
    res.clearCookie.mockReturnValue(res);
    return res;
};

describe('token cookie constants', () => {
    it('uses "token" as the cookie name', () => {
        expect(TOKEN_COOKIE).toBe('token');
    });

    it('marks the cookie httpOnly, sameSite none, and secure only in production', () => {
        expect(TOKEN_COOKIE_OPTIONS).toEqual({
            httpOnly: true,
            secure: env.isProduction,
            sameSite: 'none',
        });
    });
});

describe('setTokenCookie', () => {
    it('sets the cookie with the token, shared options, and an expiry in milliseconds', () => {
        const res = createResponse();

        setTokenCookie(res as unknown as Response, 'signed-token');

        expect(res.cookie).toHaveBeenCalledWith('token', 'signed-token', {
            httpOnly: true,
            secure: env.isProduction,
            sameSite: 'none',
            maxAge: env.jwtExpiresIn * 1000,
        });
    });
});

describe('clearTokenCookie', () => {
    it('clears the same cookie with the shared options', () => {
        const res = createResponse();

        clearTokenCookie(res as unknown as Response);

        expect(res.clearCookie).toHaveBeenCalledWith('token', TOKEN_COOKIE_OPTIONS);
    });
});
