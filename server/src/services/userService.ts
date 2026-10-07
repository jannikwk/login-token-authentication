import { v7 as uuidv7 } from "uuid";
import type { NewUser, User } from "../types/user.types";
import { AuthenticationError, ConflictError, ValidationError } from "../errors/AppError";
import { logger } from "../utils/logger";
import type { Logger } from "pino";
import { comparePassword, hashPassword } from "../utils/password";

const users: NewUser[] = [];
const pendingUsernames = new Set<string>();

const toUser = (user: NewUser): User => ({ id: user.id, username: user.username });

const findByUsername = (username: string) => users.find((u) => u.username === username);

export const createUser = async (username: string, password: string, log: Logger = logger): Promise<User> => {
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    
    if (!normalizedUsername) {
        throw new ValidationError('Please enter a username');
    }

    if (typeof password !== 'string' || password.trim() === '') {
        throw new ValidationError('Please enter a password');
    }

    if (pendingUsernames.has(normalizedUsername) || findByUsername(normalizedUsername)) {
        log.warn({ username }, 'User creation failed because the username already exists');
        throw new ConflictError('Username is already taken');
    }

    pendingUsernames.add(normalizedUsername);

    try {
        const encryptedPassword = await hashPassword(password);

        const newUser: NewUser = {
            id: uuidv7(),
            username: normalizedUsername,
            passwordHash: encryptedPassword
        };

        users.push(newUser);
        log.info({ userId: newUser.id }, 'User created successfully');
        
        return toUser(newUser);
    } finally {
        pendingUsernames.delete(normalizedUsername);
    }
};

export const authenticateUser = async (username: string, password: string, log: Logger = logger): Promise<User> => {
    const user = findByUsername(username);
    if (!user) {
        log.warn('Authentication failed because the user does not exist');
        throw new AuthenticationError();
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
        log.warn('Authentication failed due to invalid password');
        throw new AuthenticationError();
    }

    log.info({ userId: user.id }, 'User authenticated successfully');
    return toUser(user);
};

export const getUserById = async (id: string, log: Logger = logger): Promise<User | undefined> => {
    const user = users.find((u) => u.id === id);
    if (!user) {
        log.warn({ userId: id }, 'User not found');
        return undefined;
    }

    return toUser(user);
};