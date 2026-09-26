import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const TEST_CLIENT_URL = 'http://localhost:5173';
const TEST_JWT_SECRET = 'abcdefghijklmnopqrstuvwxyz123456';
const TEST_SALT_ROUNDS = '12';

const TEST_USERNAME = 'alice';
const TEST_PASSWORD = 'supersecret123';

beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('CLIENT_URL', TEST_CLIENT_URL);
    vi.stubEnv('JWT_SECRET', TEST_JWT_SECRET);
    vi.stubEnv('SALT_ROUNDS', TEST_SALT_ROUNDS);
});

afterEach(() => {
    vi.unstubAllEnvs();
});

const loadUserService = async () => {
    const { createUser, authenticateUser, getUserById } = await import('../../../src/services/userService');
    return { createUser, authenticateUser, getUserById };
}

describe('createUser', () => {
    it('creates a user with a safe public profile', async () => {
        const { createUser } = await loadUserService();

        const user = await createUser(TEST_USERNAME, TEST_PASSWORD);

        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('username');
        expect(user.username).toBe(TEST_USERNAME);
        expect(user).not.toHaveProperty('passwordHash');
    });

    it('throws a conflict error when the username already exists', async () => {
        const { createUser } = await loadUserService();
        await createUser(TEST_USERNAME, TEST_PASSWORD);

        await expect(createUser(TEST_USERNAME, 'anotherPassword456')).rejects.toThrow('Username is already taken');
    });

    it.each(['', ' ', '\t', '   ', '\t\t'])('throws an error when the username is %p', async (username) => {
        const { createUser } = await loadUserService();
        await expect(createUser(username, TEST_PASSWORD)).rejects.toThrow('Please enter a username');
    });

    it.each(['', ' ', '\t', '   ', '\t\t'])('throws an error when the password is %p', async (password) => {
        const { createUser } = await loadUserService();
        await expect(createUser(TEST_USERNAME, password)).rejects.toThrow('Please enter a password');
    });

    it('throws a conflict error when the username is already being created', async () => {
        const { createUser } = await loadUserService();

        const firstCall = createUser(TEST_USERNAME, TEST_PASSWORD);

        await expect(createUser(TEST_USERNAME, 'anotherPassword456')).rejects.toThrow('Username is already taken');
        await firstCall;
    });
})

describe('authenticateUser', () => {
    it('authenticates a user with the correct password', async () => {
        const { createUser, authenticateUser } = await loadUserService();
        const createdUser = await createUser(TEST_USERNAME, TEST_PASSWORD);

        const authenticatedUser = await authenticateUser(TEST_USERNAME, TEST_PASSWORD);

        expect(authenticatedUser).toEqual(createdUser);
        expect(authenticatedUser).not.toHaveProperty('passwordHash');
    });

    it('throws an authentication error for an incorrect password', async () => {
        const { createUser, authenticateUser } = await loadUserService();
        await createUser(TEST_USERNAME, TEST_PASSWORD);

        await expect(authenticateUser(TEST_USERNAME, 'wrongPassword456'))
            .rejects.toThrow('Invalid username or password');
    });

    it('throws an authentication error for an incorrect username', async () => {
        const { createUser, authenticateUser } = await loadUserService();
        await createUser(TEST_USERNAME, TEST_PASSWORD);

        await expect(authenticateUser('unknown-user', TEST_PASSWORD))
            .rejects.toThrow('Invalid username or password');
    });

    it('throws an authentication error for an empty username', async () => {
        const { authenticateUser } = await loadUserService();

        await expect(authenticateUser('', TEST_PASSWORD))
            .rejects.toThrow('Invalid username or password');
    });

    it('throws an authentication error for an empty password', async () => {
        const { createUser, authenticateUser } = await loadUserService();
        await createUser(TEST_USERNAME, TEST_PASSWORD);

        await expect(authenticateUser(TEST_USERNAME, ''))
            .rejects.toThrow('Invalid username or password');
    });
})

describe('getUserById', () => {
    it('returns a user with a safe public profile when the ID exists', async () => {
        const { createUser, getUserById } = await loadUserService();
        const createdUser = await createUser(TEST_USERNAME, TEST_PASSWORD);

        const user = await getUserById(createdUser.id);

        expect(user).toEqual(createdUser);
        expect(user).not.toHaveProperty('passwordHash');
    });

    it('returns undefined when the ID does not exist', async () => {
        const { getUserById } = await loadUserService();
        await expect(getUserById('non-existent-user-id')).resolves.toBeUndefined();
    });
});

