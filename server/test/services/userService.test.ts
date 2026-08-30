import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const TEST_CLIENT_URL = 'http://localhost:5173';
const TEST_JWT_SECRET = 'abcdefghijklmnopqrstuvwxyz123456';
const TEST_SALT_ROUNDS = '12';

const TEST_USERNAME = 'alice';
const TEST_PASSWORD = 'supersecret123';

const loadCreateUser = async () => {
    const { createUser } = await import('../../src/services/userService');
    return { createUser };
}

describe('createUser', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.stubEnv('CLIENT_URL', TEST_CLIENT_URL);
        vi.stubEnv('JWT_SECRET', TEST_JWT_SECRET);
        vi.stubEnv('SALT_ROUNDS', TEST_SALT_ROUNDS);
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('creates a user with a safe public profile', async () => {
        const { createUser } = await loadCreateUser();

        const user = await createUser(TEST_USERNAME, TEST_PASSWORD);

        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('username');
        expect(user.username).toBe(TEST_USERNAME);
        expect(user).not.toHaveProperty('passwordHash');
    });

    it('throws a conflict error when the username already exists', async () => {
        const { createUser } = await loadCreateUser();
        await createUser(TEST_USERNAME, TEST_PASSWORD);

        await expect(createUser(TEST_USERNAME, 'anotherPassword456')).rejects.toThrow('Username is already taken');
    });

    it('throws an error when the username is empty', async () => {
        const { createUser } = await loadCreateUser();
        await expect(createUser('', TEST_PASSWORD)).rejects.toThrow('Please enter a username');
    });

    it('throws an error when the password is empty', async () => {
        const { createUser } = await loadCreateUser();
        await expect(createUser(TEST_USERNAME, '')).rejects.toThrow('Please enter a password');
    });

    it('throws a conflict error when the username is already being created', async () => {
        const { createUser } = await loadCreateUser();

        const firstCall = createUser(TEST_USERNAME, TEST_PASSWORD);

        await expect(createUser(TEST_USERNAME, 'anotherPassword456')).rejects.toThrow('Username is already taken');
        await firstCall;
    });
})

