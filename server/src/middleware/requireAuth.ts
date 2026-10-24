import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';
import { TOKEN_COOKIE } from '../config/cookies';
import { UnauthenticatedError } from '../errors/applicationErrors';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.[TOKEN_COOKIE];

    if (!token) {
        throw new UnauthenticatedError();
    }

    const payload = verifyToken(token);
    req.userId = payload.sub;

    next();
}