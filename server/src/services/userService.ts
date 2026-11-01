import { InvalidCredentialsError, InvalidInputError, UsernameAlreadyExistsError } from "../errors/applicationErrors";
import { logger } from "../utils/logger";
import type { Logger } from "pino";
import { comparePassword, hashPassword } from "../utils/password";
import { CredentialsSchema, PublicUser, StoredUser } from "@app/shared";
import { addUser, findById, findByUsername } from "../repositories/userRepository";

const pendingUsernames = new Set<string>();

const toUser = (user: StoredUser): PublicUser => ({ id: user.id, username: user.username });

const parseCredentials = (username: string, password: string) => {
    const result = CredentialsSchema.safeParse({ username, password });

    if (!result.success) {
        throw new InvalidInputError(result.error.issues[0]?.message);
    }

    return result.data;
};

export const createUser = async (username: string, password: string, log: Logger = logger): Promise<PublicUser> => {
    const credentials = parseCredentials(username, password);

    if (pendingUsernames.has(credentials.username) || findByUsername(credentials.username)) {
        log.warn({ username: credentials.username }, 'User creation failed because the username already exists');
        throw new UsernameAlreadyExistsError();
    }

    pendingUsernames.add(credentials.username);

    try {
        const passwordHash = await hashPassword(credentials.password);

        const newUser = addUser(credentials.username, passwordHash);
        if (!newUser) {
            log.warn({ username: credentials.username }, 'User creation failed because the username already exists');
            throw new UsernameAlreadyExistsError();
        }

        log.info({ userId: newUser.id }, 'User created successfully');

        return toUser(newUser);
    } finally {
        pendingUsernames.delete(credentials.username);
    }
};

export const authenticateUser = async (username: string, password: string, log: Logger = logger): Promise<PublicUser> => {
    let credentials;
    try {
        credentials = parseCredentials(username, password);
    } catch {
        log.warn('Authentication failed because the credentials are invalid');
        throw new InvalidCredentialsError();
    }

    const user = findByUsername(credentials.username);
    if (!user) {
        log.warn('Authentication failed because the user does not exist');
        throw new InvalidCredentialsError('Invalid username or password');
    }

    const isPasswordValid = await comparePassword(credentials.password, user.passwordHash);
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