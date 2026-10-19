import type { Response } from 'express';
import { env } from './env';

export const TOKEN_COOKIE = 'token';

export const TOKEN_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' as const : 'lax' as const,
};

export const setTokenCookie = (res: Response, token: string) => {
    res.cookie(TOKEN_COOKIE, token, { ...TOKEN_COOKIE_OPTIONS, maxAge: env.jwtExpiresIn * 1000 });
};

export const clearTokenCookie = (res: Response) => {
    res.clearCookie(TOKEN_COOKIE, TOKEN_COOKIE_OPTIONS);
};
