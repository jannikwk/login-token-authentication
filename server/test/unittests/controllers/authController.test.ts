import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { login, logout, me, register } from '../../../src/controllers/authController';
import { ConflictError } from '../../../src/errors/AppError';

const mocks = vi.hoisted(() => ({
    createUser: vi.fn(),
    authenticateUser: vi.fn(),
    getUserById: vi.fn(),
    signToken: vi.fn(),
    setTokenCookie: vi.fn(),
    clearTokenCookie: vi.fn(),
}));

vi.mock('../../../src/services/userService', () => ({
    createUser: mocks.createUser,
    authenticateUser: mocks.authenticateUser,
    getUserById: mocks.getUserById,
}));

vi.mock('../../../src/utils/jwt', () => ({
    signToken: mocks.signToken,
}));

vi.mock('../../../src/config/cookies', () => ({
    setTokenCookie: mocks.setTokenCookie,
    clearTokenCookie: mocks.clearTokenCookie,
}));

const createdUser = { id: '0192c9f4-0000-7000-8000-000000000000', username: 'alice' };
const credentials = { username: 'alice', password: 'supersecret123' };

let log: { info: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

const createRequest = (body: unknown = {}, userId?: string) => {
    return { body, userId, log } as unknown as Request;
};

const createResponse = () => {
    const res = {
        status: vi.fn(),
        json: vi.fn(),
    };
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);
    return res;
};

type MockResponse = ReturnType<typeof createResponse>;

beforeEach(() => {
    vi.resetAllMocks();
    log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
});

describe('register', () => {
    it('creates the user and responds with 201 and the public profile', async () => {
        mocks.createUser.mockResolvedValue(createdUser);
        const req = createRequest(credentials);
        const res = createResponse();

        const result = await register(req, res as unknown as Response);

        expect(mocks.createUser).toHaveBeenCalledWith('alice', 'supersecret123', log);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(createdUser);
        expect(result).toBe(res);
    });

    it('propagates a creation failure such as a username conflict', async () => {
        mocks.createUser.mockRejectedValue(new ConflictError('Username is already taken'));
        const req = createRequest(credentials);
        const res = createResponse();

        await expect(register(req, res as unknown as Response))
            .rejects.toThrow('Username is already taken');
        expect(res.status).not.toHaveBeenCalled();
    });
});

describe('login', () => {
    it('authenticates, signs a token, sets the cookie, and responds with 200', async () => {
        mocks.authenticateUser.mockResolvedValue(createdUser);
        mocks.signToken.mockReturnValue('signed-token');
        const req = createRequest(credentials);
        const res = createResponse();

        const result = await login(req, res as unknown as Response);

        expect(mocks.authenticateUser).toHaveBeenCalledWith('alice', 'supersecret123', log);
        expect(mocks.signToken).toHaveBeenCalledWith(createdUser);
        expect(mocks.setTokenCookie).toHaveBeenCalledWith(res, 'signed-token');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createdUser);
        expect(result).toBe(res);
    });
});

describe('logout', () => {
    it('clears the token cookie and responds with 200', () => {
        const req = createRequest();
        const res = createResponse();

        const result = logout(req, res as unknown as Response);

        expect(mocks.clearTokenCookie).toHaveBeenCalledWith(res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
        expect(result).toBe(res);
    });
});

describe('me', () => {
    it('rejects when the request has no authenticated user', async () => {
        const req = createRequest();
        const res = createResponse();

        await expect(me(req, res as unknown as Response))
            .rejects.toThrow('Not authenticated');
        expect(mocks.getUserById).not.toHaveBeenCalled();
    });

    it('rejects when the user no longer exists', async () => {
        mocks.getUserById.mockResolvedValue(undefined);
        const req = createRequest({}, createdUser.id);
        const res = createResponse();

        await expect(me(req, res as unknown as Response))
            .rejects.toThrow('User not found');
        expect(mocks.getUserById).toHaveBeenCalledWith(createdUser.id, log);
    });

    it('responds with 200 and the public profile', async () => {
        mocks.getUserById.mockResolvedValue(createdUser);
        const req = createRequest({}, createdUser.id);
        const res = createResponse();

        const result = await me(req, res as unknown as Response);

        expect(mocks.getUserById).toHaveBeenCalledWith(createdUser.id, log);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createdUser);
        expect(result).toBe(res);
    });
});
