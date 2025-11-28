import { User } from '@/features/auth/domain/User';
import { UserRepository } from '@/features/profile/domain/UserRepository';

/**
 * Use case for retrieving a user profile by username.
 * Used for public profile viewing.
 */
export class GetUserByUsernameUseCase {
    constructor(private userRepository: UserRepository) { }

    /**
     * Execute the use case to fetch user by username.
     * @param username - The username to search for
     * @returns User if found, null otherwise
     */
    async execute(username: string): Promise<User | null> {
        if (!username || username.trim().length === 0) {
            throw new Error('Username is required');
        }

        // Use username exactly as provided (case-sensitive match)
        const normalizedUsername = username.trim();

        return await this.userRepository.getUserByUsername(normalizedUsername);
    }
}
