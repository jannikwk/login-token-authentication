import { Credentials } from "@app/shared";
import { createApp } from "../../../src/app";
import request from "supertest";
import { testEnv } from "../../setup";
import jwt from 'jsonwebtoken';

const app = createApp();
const uniqueCredentials = (): Credentials => ({
    username: `user-${crypto.randomUUID().slice(0, 12)}`,
    password: 'secure-password-123',
});

describe('POST /api/auth/register', () => {
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

    it('rejects invalid payloads and duplicate usernames', async () => {
        const invalidResponse = await request(app)
            .post('/api/auth/register')
            .send({ username: 'ab', password: 'secure-password-123' });

        expect(invalidResponse.status).toBe(400);
        expect(invalidResponse.body).toEqual({ message: 'Username must be at least 3 characters' });

        const credentials = uniqueCredentials();
        const firstResponse = await request(app).post('/api/auth/register').send(credentials);
        expect(firstResponse.status).toBe(201);

        const duplicateResponse = await request(app)
            .post('/api/auth/register')
            .send(credentials);

        expect(duplicateResponse.status).toBe(409);
        expect(duplicateResponse.body).toEqual({ message: 'Username is already taken' });
    });
});

describe('POST /api/auth/login', () => {
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

    it('returns generic credentials errors for invalid login bodies', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'ab', password: 'short' });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ message: 'Invalid username or password' });
    });

    it('returns the same unauthorized response for unknown users and bad passwords', async () => {
        const credentials = uniqueCredentials();
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send(credentials);
        expect(registerResponse.status).toBe(201);

        const unknownUserResponse = await request(app)
            .post('/api/auth/login')
            .send({ ...credentials, username: `missing-${crypto.randomUUID().slice(0, 12)}` });
        const wrongPasswordResponse = await request(app)
            .post('/api/auth/login')
            .send({ ...credentials, password: 'wrong-password-123' });

        expect(unknownUserResponse.status).toBe(401);
        expect(unknownUserResponse.body).toEqual({ message: 'Invalid username or password' });
        expect(wrongPasswordResponse.status).toBe(401);
        expect(wrongPasswordResponse.body).toEqual({ message: 'Invalid username or password' });
    });
});

describe('POST /api/auth/logout', () => {
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
});

describe('GET /api/auth/me', () => {
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

    it.each([
        ['missing cookie', undefined],
        ['malformed cookie', 'token=not-a-jwt'],
        ['tampered cookie', 'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'],
    ])('rejects a %s on the protected endpoint', async (_label, cookie) => {
        const requestBuilder = request(app).get('/api/auth/me');
        if (cookie) {
            requestBuilder.set('Cookie', cookie);
        }
        const response = await requestBuilder;

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            message: cookie ? 'Invalid or expired token' : 'Not authenticated',
        });
    });

    it('rejects an expired token', async () => {
        const expiredToken = jwt.sign(
            { username: 'expired-user' },
            testEnv.JWT_SECRET,
            { subject: 'expired-user-id', expiresIn: -1 },
        );

        const response = await request(app)
            .get('/api/auth/me')
            .set('Cookie', `token=${expiredToken}`);

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ message: 'Invalid or expired token' });
    });
});

describe('Authentication lifecycle', () => {
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