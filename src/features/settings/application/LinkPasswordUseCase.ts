import { AuthRepository } from '../../auth/domain/AuthRepository';

export class LinkPasswordUseCase {
    constructor(private authRepository: AuthRepository) { }

    async execute(password: string): Promise<void> {
        // Validate password strength
        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        if (!/[A-Z]/.test(password)) {
            throw new Error('Password must contain at least one uppercase letter');
        }

        if (!/[a-z]/.test(password)) {
            throw new Error('Password must contain at least one lowercase letter');
        }

        if (!/[0-9]/.test(password)) {
            throw new Error('Password must contain at least one number');
        }

        await this.authRepository.linkPassword(password);
    }
}
