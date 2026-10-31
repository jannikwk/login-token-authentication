import jwt from 'jsonwebtoken';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { env } from '../../src/config/env';
import {
    cookieHeader,
    jsonRequest,
    startTestServer,
    stopTestServer,
    uniqueCredentials,
} from './testServer';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
    ({ server, baseUrl } = await startTestServer());
});

afterAll(async () => {
    await stopTestServer(server);
});

describe('authentication API errors', () => {
    it('rejects invalid payloads and duplicate usernames', async () => {
        const invalidResponse = await jsonRequest(baseUrl, '/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username: 'ab', password: 'secure-password-123' }),
        });

        expect(invalidResponse.status).toBe(400);
        expect(await invalidResponse.json()).toEqual({ message: 'Username must be at least 3 characters' });

        const credentials = uniqueCredentials();
        const firstResponse = await jsonRequest(baseUrl, '/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
        expect(firstResponse.status).toBe(201);

        const duplicateResponse = await jsonRequest(baseUrl, '/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });

        expect(duplicateResponse.status).toBe(409);
        expect(await duplicateResponse.json()).toEqual({ message: 'Username is already taken' });
    });

    it('returns the same unauthorized response for unknown users and bad passwords', async () => {
        const credentials = uniqueCredentials();
        const registerResponse = await jsonRequest(baseUrl, '/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
        expect(registerResponse.status).toBe(201);

        const unknownUserResponse = await jsonRequest(baseUrl, '/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ ...credentials, username: `missing-${crypto.randomUUID().slice(0, 12)}` }),
        });
        const wrongPasswordResponse = await jsonRequest(baseUrl, '/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ ...credentials, password: 'wrong-password-123' }),
        });

        expect(unknownUserResponse.status).toBe(401);
        expect(await unknownUserResponse.json()).toEqual({ message: 'Invalid username or password' });
        expect(wrongPasswordResponse.status).toBe(401);
        expect(await wrongPasswordResponse.json()).toEqual({ message: 'Invalid username or password' });
    });

    it.each([
        ['missing cookie', undefined],
        ['malformed cookie', 'token=not-a-jwt'],
        ['tampered cookie', 'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'],
    ])('rejects a %s on the protected endpoint', async (_label, cookie) => {
        const response = await jsonRequest(baseUrl, '/api/auth/me', cookie ? {
            headers: cookieHeader(cookie),
        } : undefined);

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({
            message: cookie ? 'Invalid or expired token' : 'Not authenticated',
        });
    });

    it('rejects an expired token', async () => {
        const expiredToken = jwt.sign(
            { username: 'expired-user' },
            env.jwtSecret,
            { subject: 'expired-user-id', expiresIn: -1 },
        );

        const response = await jsonRequest(baseUrl, '/api/auth/me', {
            headers: cookieHeader(`token=${expiredToken}`),
        });

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ message: 'Invalid or expired token' });
    });
});
