export type ApplicationErrorCode =
    | 'INVALID_INPUT'
    | 'USERNAME_ALREADY_EXISTS'
    | 'INVALID_CREDENTIALS'
    | 'INVALID_TOKEN'
    | 'UNAUTHENTICATED'
    | 'USER_NOT_FOUND';

export abstract class ApplicationError extends Error {
    abstract readonly code: ApplicationErrorCode;

    protected constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class InvalidInputError extends ApplicationError {
    readonly code = 'INVALID_INPUT';

    constructor(message = 'Invalid input data') {
        super(message);
    }
}

export class UsernameAlreadyExistsError extends ApplicationError {
    readonly code = 'USERNAME_ALREADY_EXISTS';

    constructor(message = 'Username is already taken') {
        super(message);
    }
}

export class InvalidCredentialsError extends ApplicationError {
    readonly code = 'INVALID_CREDENTIALS';

    constructor(message = 'Invalid username or password') {
        super(message);
    }
}

export class InvalidTokenError extends ApplicationError {
    readonly code = 'INVALID_TOKEN';

    constructor(message = 'Invalid or expired token') {
        super(message);
    }
}

export class UnauthenticatedError extends ApplicationError {
    readonly code = 'UNAUTHENTICATED';

    constructor(message = 'Not authenticated') {
        super(message);
    }
}

export class UserNotFoundError extends ApplicationError {
    readonly code = 'USER_NOT_FOUND';

    constructor(userId: string, message = `User with id ${userId} not found`) {
        super(message);
    }
}