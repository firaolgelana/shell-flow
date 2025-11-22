export class AuthError extends Error {
    constructor(message: string, public code?: string) {
        super(message);
        this.name = 'AuthError';
    }
}

export class InvalidCredentialsError extends AuthError {
    constructor() {
        super('Invalid credentials provided.', 'auth/invalid-credentials');
        this.name = 'InvalidCredentialsError';
    }
}

export class UserNotFoundError extends AuthError {
    constructor() {
        super('User not found.', 'auth/user-not-found');
        this.name = 'UserNotFoundError';
    }
}

export class EmailAlreadyInUseError extends AuthError {
    constructor() {
        super('Email is already in use.', 'auth/email-already-in-use');
        this.name = 'EmailAlreadyInUseError';
    }
}
