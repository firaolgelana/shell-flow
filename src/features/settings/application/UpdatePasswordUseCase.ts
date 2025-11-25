import { AuthRepository } from '../../auth/domain/AuthRepository';

export class UpdatePasswordUseCase {
    constructor(private authRepository: AuthRepository) { }

    async execute(currentPassword: string, newPassword: string): Promise<void> {
        // Validate new password strength
        if (newPassword.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        if (!/[A-Z]/.test(newPassword)) {
            throw new Error('Password must contain at least one uppercase letter');
        }

        if (!/[a-z]/.test(newPassword)) {
            throw new Error('Password must contain at least one lowercase letter');
        }

        if (!/[0-9]/.test(newPassword)) {
            throw new Error('Password must contain at least one number');
        }

        if (currentPassword === newPassword) {
            throw new Error('New password must be different from current password');
        }

        await this.authRepository.updatePassword(currentPassword, newPassword);
    }
}
