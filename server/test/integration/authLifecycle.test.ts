import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
    cookieFrom,
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

describe('authentication API lifecycle', () => {
    it('registers, logs in, reads the persisted user, then logs out', async () => {
        const credentials = uniqueCredentials();
        const registerResponse = await jsonRequest(baseUrl, '/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
        const registeredUser = await registerResponse.json();

        expect(registerResponse.status).toBe(201);
        expect(registeredUser).toMatchObject({ username: credentials.username });
        expect(registeredUser).not.toHaveProperty('password');
        expect(registeredUser).not.toHaveProperty('passwordHash');

        const loginResponse = await jsonRequest(baseUrl, '/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
        const loginUser = await loginResponse.json();
        const tokenCookie = cookieFrom(loginResponse);

        expect(loginResponse.status).toBe(200);
        expect(loginUser).toEqual(registeredUser);
        expect(loginResponse.headers.get('set-cookie')).toMatch(/token=[^;]+/);
        expect(loginResponse.headers.get('set-cookie')).toMatch(/HttpOnly/i);

        const meResponse = await jsonRequest(baseUrl, '/api/auth/me', {
            headers: cookieHeader(tokenCookie),
        });

        expect(meResponse.status).toBe(200);
        expect(await meResponse.json()).toEqual(registeredUser);

        const logoutResponse = await jsonRequest(baseUrl, '/api/auth/logout', {
            method: 'POST',
            headers: cookieHeader(tokenCookie),
        });

        expect(logoutResponse.status).toBe(200);
        expect(await logoutResponse.json()).toEqual({ message: 'Logged out successfully' });
        const logoutSetCookie = logoutResponse.headers.get('set-cookie');
        expect(logoutSetCookie).toMatch(/(?:^|,\s*)token=;/i);

        const expires = logoutSetCookie?.match(/(?:^|;\s*)Expires=([^;]+)/i)?.[1];
        const maxAge = logoutSetCookie?.match(/(?:^|;\s*)Max-Age=(-?\d+)/i)?.[1];
        expect(
            (expires !== undefined && Date.parse(expires) < Date.now())
            || (maxAge !== undefined && Number(maxAge) <= 0),
        ).toBe(true);

        const unauthenticatedResponse = await jsonRequest(baseUrl, '/api/auth/me');
        expect(unauthenticatedResponse.status).toBe(401);
        expect(await unauthenticatedResponse.json()).toEqual({ message: 'Not authenticated' });
    });
});
