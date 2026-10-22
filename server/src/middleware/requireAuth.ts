import type { NextFunction, Request, Response } from 'express';
import { AuthenticationError } from '../errors/applicationErrors';
import { verifyToken } from '../utils/jwt';
import { TOKEN_COOKIE } from '../config/cookies';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.[TOKEN_COOKIE];

    if (!token) {
        throw new AuthenticationError('Not authenticated');
    }

    const payload = verifyToken(token);
    req.userId = payload.sub;

    next();
}