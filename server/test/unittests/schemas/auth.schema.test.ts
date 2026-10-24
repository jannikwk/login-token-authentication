import { describe, expect, it } from 'vitest';
import { CredentialsSchema } from '@app/shared';

const firstIssueMessage = (body: unknown): string | undefined => {
    const result = CredentialsSchema.safeParse(body);
    expect(result.success).toBe(false);
    if (result.success) return undefined;
    return result.error.issues[0]?.message;
};

describe('CredentialsSchema', () => {
    it('accepts a valid authentication payload', () => {
        const result = CredentialsSchema.safeParse({ username: 'alice', password: 'supersecret123' });

        expect(result.success).toBe(true);
        if (result.success) expect(result.data).toEqual({ username: 'alice', password: 'supersecret123' });
    });

    it('accepts the minimum and maximum allowed lengths', () => {
        expect(CredentialsSchema.safeParse({ username: 'abc', password: 'a'.repeat(10) }).success).toBe(true);
        expect(CredentialsSchema.safeParse({ username: 'a'.repeat(30), password: 'a'.repeat(72) }).success).toBe(true);
    });

    it('rejects a username below the minimum length', () => {
        expect(firstIssueMessage({ username: 'ab', password: 'supersecret123' }))
            .toBe('Username must be at least 3 characters');
    });

    it('rejects a username above the maximum length', () => {
        expect(firstIssueMessage({ username: 'a'.repeat(31), password: 'supersecret123' }))
            .toBe('Username must not exceed 30 characters');
    });

    it('rejects a password below the minimum length', () => {
        expect(firstIssueMessage({ username: 'alice', password: 'short' }))
            .toBe('Password must be at least 10 characters');
    });

    it('rejects a password above the maximum length', () => {
        expect(firstIssueMessage({ username: 'alice', password: 'a'.repeat(73) }))
            .toBe('Password must not exceed 72 characters');
    });

    it('rejects a payload with a missing username', () => {
        expect(CredentialsSchema.safeParse({ password: 'supersecret123' }).success).toBe(false);
    });

    it('rejects a payload with a missing password', () => {
        expect(CredentialsSchema.safeParse({ username: 'alice' }).success).toBe(false);
    });

    it('rejects an empty payload', () => {
        expect(CredentialsSchema.safeParse({}).success).toBe(false);
    });

    it('rejects non-string fields', () => {
        expect(CredentialsSchema.safeParse({ username: 12345, password: 'supersecret123' }).success).toBe(false);
        expect(CredentialsSchema.safeParse({ username: 'alice', password: 12345 }).success).toBe(false);
    });
});
