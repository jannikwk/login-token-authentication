import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { Credentials } from '@app/shared';
import { createApp } from '../../src/app';
import { env } from '../../src/config/env';

const app = createApp();
const uniqueCredentials = (): Credentials => ({
    username: `user-${crypto.randomUUID().slice(0, 12)}`,
    password: 'secure-password-123',
});

describe('authentication API errors', () => {
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
            env.jwtSecret,
            { subject: 'expired-user-id', expiresIn: -1 },
        );

        const response = await request(app)
            .get('/api/auth/me')
            .set('Cookie', `token=${expiredToken}`);

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ message: 'Invalid or expired token' });
    });
});
