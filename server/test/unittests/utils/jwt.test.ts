import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { signToken, verifyToken } from '../../../src/utils/jwt';
import { InvalidTokenError } from '../../../src/errors/applicationErrors';
import { env } from '../../../src/config/env';

const testUser = {
    id: '0192c9f4-0000-7000-8000-000000000000',
    username: 'alice',
};

describe('signToken', () => {
    it('returns a string token', () => {
        const token = signToken(testUser);

        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3);
    });
});

describe('verifyToken', () => {
    it('round-trips a signed token back to its payload', () => {
        const token = signToken(testUser);

        const payload = verifyToken(token);

        expect(payload).toMatchObject({ sub: testUser.id, username: testUser.username });
        expect(payload.sub).toBe(testUser.id);
    });

    it('includes an expiry timestamp in the payload', () => {
        const payload = verifyToken(signToken(testUser));

        expect(payload).toHaveProperty('exp');
        expect(payload).toHaveProperty('iat');
    });

    it('throws an InvalidTokenError for a malformed token', () => {
        expect(() => verifyToken('not-a-valid-token'))
            .toThrow(new InvalidTokenError());
    });

    it('throws an InvalidTokenError for a token signed with a different secret', () => {
        const foreignToken = jwt.sign(
            { username: testUser.username },
            'a-completely-different-secret-value!',
            { subject: testUser.id, expiresIn: 3600 }
        );

        expect(() => verifyToken(foreignToken))
            .toThrow(new InvalidTokenError());
    });

    it('throws an InvalidTokenError for an expired token', () => {
        const expiredToken = jwt.sign(
            { username: testUser.username },
            env.jwtSecret,
            { subject: testUser.id, expiresIn: -60 }
        );

        expect(() => verifyToken(expiredToken))
            .toThrow(new InvalidTokenError());
    });

    it('throws an InvalidTokenError for an empty token', () => {
        expect(() => verifyToken(''))
            .toThrow(new InvalidTokenError());
    });
});
