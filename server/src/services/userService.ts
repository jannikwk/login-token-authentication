import { InvalidCredentialsError, InvalidInputError, UsernameAlreadyExistsError } from "../errors/applicationErrors";
import { logger } from "../utils/logger";
import type { Logger } from "pino";
import { comparePassword, hashPassword } from "../utils/password";
import { PublicUser, StoredUser } from "@app/shared";
import { addUser, findById, findByUsername } from "../repositories/userRepository";

const pendingUsernames = new Set<string>();

const toUser = (user: StoredUser): PublicUser => ({ id: user.id, username: user.username });

export const createUser = async (username: string, password: string, log: Logger = logger): Promise<PublicUser> => {
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';

    if (!normalizedUsername) {
        throw new InvalidInputError('Please enter a username');
    }

    if (typeof password !== 'string' || password.trim() === '') {
        throw new InvalidInputError('Please enter a password');
    }

    if (pendingUsernames.has(normalizedUsername) || findByUsername(normalizedUsername)) {
        log.warn({ username }, 'User creation failed because the username already exists');
        throw new UsernameAlreadyExistsError();
    }

    pendingUsernames.add(normalizedUsername);

    try {
        const passwordHash = await hashPassword(password);
        
        const newUser = addUser(normalizedUsername, passwordHash);
        if (!newUser) {
            log.warn({ username }, 'User creation failed because the username already exists');
            throw new UsernameAlreadyExistsError();
        }

        log.info({ userId: newUser.id }, 'User created successfully');

        return toUser(newUser);
    } finally {
        pendingUsernames.delete(normalizedUsername);
    }
};

export const authenticateUser = async (username: string, password: string, log: Logger = logger): Promise<PublicUser> => {
    const user = findByUsername(username);
    if (!user) {
        log.warn('Authentication failed because the user does not exist');
        throw new InvalidCredentialsError('Invalid username or password');
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
        log.warn('Authentication failed due to invalid password');
        throw new InvalidCredentialsError('Invalid username or password');
    }

    log.info({ userId: user.id }, 'User authenticated successfully');
    return toUser(user);
};

export const getUserById = async (id: string, log: Logger = logger): Promise<PublicUser | undefined> => {
    const user = findById(id);
    if (!user) {
        log.warn({ userId: id }, 'User not found');
        return undefined;
    }

    return toUser(user);
};