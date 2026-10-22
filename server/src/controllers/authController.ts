import type { Request, Response } from 'express';
import { authenticateUser, createUser, getUserById } from '../services/userService';
import { signToken } from '../utils/jwt';
import { clearTokenCookie, setTokenCookie } from '../config/cookies';
import { UnauthenticatedError, UserNotFoundError } from '../errors/applicationErrors';

export const register = async (req: Request, res: Response) => {
    const { username, password } = req.body;

    const newUser = await createUser(username, password, req.log);
    req.log.info({ userId: newUser.id }, 'User registered successfully');

    return res.status(201).json(newUser);
};

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;

    const authenticatedUser = await authenticateUser(username, password, req.log);
    const token = signToken(authenticatedUser);
    req.log.info({ userId: authenticatedUser.id }, 'User logged in successfully');

    setTokenCookie(res, token);
    return res.status(200).json(authenticatedUser);
};

export const logout = (req: Request, res: Response) => {
    clearTokenCookie(res);
    return res.status(200).json({ message: 'Logged out successfully' });
};

export const me = async (req: Request, res: Response) => {
    if (!req.userId) throw new UnauthenticatedError();
    const user = await getUserById(req.userId, req.log);

    if (!user) {
        throw new UserNotFoundError(req.userId);
    }

    return res.status(200).json(user);
};