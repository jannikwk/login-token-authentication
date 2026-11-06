import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { Credentials } from '@app/shared';
import { createApp } from '../../src/app';

const app = createApp();
const uniqueCredentials = (): Credentials => ({
    username: `user-${crypto.randomUUID().slice(0, 12)}`,
    password: 'secure-password-123',
});

describe('authentication API lifecycle', () => {
    it('registers a user without exposing credentials', async () => {
        const credentials = uniqueCredentials();
        const response = await request(app)
            .post('/api/auth/register')
            .send(credentials);

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({ username: credentials.username });
        expect(response.body).not.toHaveProperty('password');
        expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('logs in a registered user and sets an HTTP-only token cookie', async () => {
        const credentials = uniqueCredentials();
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send(credentials);

        const response = await request(app)
            .post('/api/auth/login')
            .send(credentials);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(registerResponse.body);
        expect(response.headers['set-cookie']?.[0]).toMatch(/token=[^;]+/);
        expect(response.headers['set-cookie']?.[0]).toMatch(/HttpOnly/i);
    });

    it('returns the authenticated user from the protected endpoint', async () => {
        const credentials = uniqueCredentials();
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send(credentials);
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send(credentials);
        const tokenCookie = loginResponse.headers['set-cookie']?.[0];

        if (!tokenCookie) {
            throw new Error('Expected login response to set a cookie');
        }

        const response = await request(app)
            .get('/api/auth/me')
            .set('Cookie', tokenCookie);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(registerResponse.body);
    });

    it('logs out successfully and clears the token cookie', async () => {
        const credentials = uniqueCredentials();
        await request(app)
            .post('/api/auth/register')
            .send(credentials);
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send(credentials);
        const tokenCookie = loginResponse.headers['set-cookie']?.[0];

        if (!tokenCookie) {
            throw new Error('Expected login response to set a cookie');
        }

        const response = await request(app)
            .post('/api/auth/logout')
            .set('Cookie', tokenCookie);
        const logoutCookie = response.headers['set-cookie']?.[0];

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: 'Logged out successfully' });
        expect(logoutCookie).toMatch(/(?:^|,\s*)token=;/i);

        const expires = logoutCookie?.match(/(?:^|;\s*)Expires=([^;]+)/i)?.[1];
        const maxAge = logoutCookie?.match(/(?:^|;\s*)Max-Age=(-?\d+)/i)?.[1];
        expect(
            (expires !== undefined && Date.parse(expires) < Date.now())
            || (maxAge !== undefined && Number(maxAge) <= 0),
        ).toBe(true);
    });

    it('completes the full authentication flow with a persistent agent', async () => {
        const agent = request.agent(app);
        const credentials = uniqueCredentials();
        const registerResponse = await agent
            .post('/api/auth/register')
            .send(credentials);

        const loginResponse = await agent
            .post('/api/auth/login')
            .send(credentials);
        const meResponse = await agent.get('/api/auth/me');
        const logoutResponse = await agent.post('/api/auth/logout');
        const unauthenticatedResponse = await agent.get('/api/auth/me');

        expect(registerResponse.status).toBe(201);
        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body).toEqual(registerResponse.body);
        expect(meResponse.status).toBe(200);
        expect(meResponse.body).toEqual(registerResponse.body);
        expect(logoutResponse.status).toBe(200);
        expect(logoutResponse.body).toEqual({ message: 'Logged out successfully' });
        expect(unauthenticatedResponse.status).toBe(401);
        expect(unauthenticatedResponse.body).toEqual({ message: 'Not authenticated' });
    });
});
