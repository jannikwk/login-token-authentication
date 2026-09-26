import { describe, expect, it } from 'vitest';
import { comparePassword, hashPassword } from '../../../src/utils/password';

const TEST_PASSWORD = 'supersecret123';

describe('hashPassword', () => {
    it('returns a bcrypt hash instead of the plaintext', async () => {
        const hash = await hashPassword(TEST_PASSWORD);

        expect(typeof hash).toBe('string');
        expect(hash).not.toBe(TEST_PASSWORD);
        expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
    });

    it('produces a different hash for the same password (random salt)', async () => {
        const first = await hashPassword(TEST_PASSWORD);
        const second = await hashPassword(TEST_PASSWORD);

        expect(first).not.toBe(second);
    });
});

describe('comparePassword', () => {
    it('resolves true for the correct password', async () => {
        const hash = await hashPassword(TEST_PASSWORD);

        await expect(comparePassword(TEST_PASSWORD, hash)).resolves.toBe(true);
    });

    it('resolves false for an incorrect password', async () => {
        const hash = await hashPassword(TEST_PASSWORD);

        await expect(comparePassword('wrongPassword456', hash)).resolves.toBe(false);
    });

    it('round-trips with hashPassword', async () => {
        const hash = await hashPassword(TEST_PASSWORD);

        expect(await comparePassword(TEST_PASSWORD, hash)).toBe(true);
    });
});
