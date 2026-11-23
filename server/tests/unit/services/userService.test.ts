import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { testEnv } from '../../setup';

const TEST_USERNAME = 'alice';
const TEST_PASSWORD = 'supersecret123';

beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('CLIENT_URL', testEnv.CLIENT_URL);
    vi.stubEnv('JWT_SECRET', testEnv.JWT_SECRET);
    vi.stubEnv('SALT_ROUNDS', testEnv.SALT_ROUNDS);
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

    it('throws a conflict error when the username is already being created', async () => {
        const { createUser } = await loadUserService();

        const firstCall = createUser(TEST_USERNAME, TEST_PASSWORD);

        await expect(createUser(TEST_USERNAME, 'anotherPassword456')).rejects.toThrow('Username is already taken');
        await firstCall;
    });

    it('rejects credentials that do not satisfy the shared schema', async () => {
        const { createUser } = await loadUserService();

        await expect(createUser('ab', TEST_PASSWORD)).rejects.toThrow('Username must be at least 3 characters');
        await expect(createUser(TEST_USERNAME, 'short')).rejects.toThrow('Password must be at least 10 characters');
    });

    it('normalizes the username before storing it', async () => {
        const { createUser } = await loadUserService();

        const user = await createUser(` ${TEST_USERNAME} `, TEST_PASSWORD);

        expect(user.username).toBe(TEST_USERNAME);
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

    it('rejects invalid direct authentication input without exposing validation details', async () => {
        const { authenticateUser } = await loadUserService();

        await expect(authenticateUser('ab', TEST_PASSWORD))
            .rejects.toThrow('Invalid username or password');
    });

    it('normalizes the username before authenticating', async () => {
        const { createUser, authenticateUser } = await loadUserService();
        const createdUser = await createUser(TEST_USERNAME, TEST_PASSWORD);

        await expect(authenticateUser(` ${TEST_USERNAME} `, TEST_PASSWORD)).resolves.toEqual(createdUser);
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
