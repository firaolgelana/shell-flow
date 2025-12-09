import { User } from '@/features/auth/domain/User';

/**
 * Repository interface for user profile operations.
 * Abstracts data access for user-related queries.
 */
export interface UserRepository {
    /**
     * Get user by their unique ID.
     */
    getUserById(userId: string): Promise<User | null>;

    /**
     * Get user by their unique username.
     */
    getUserByUsername(username: string): Promise<User | null>;

    /**
     * Update a user's username.
     * @throws Error if username is already taken or invalid
     */
    updateUsername(userId: string, username: string): Promise<void>;

    /**
     * Check if a username is available.
     */
    isUsernameAvailable(username: string): Promise<boolean>;

    /**
     * Update user profile information (bio, displayName).
     */
    updateProfile(userId: string, data: { bio?: string; displayName?: string }): Promise<void>;

    /**
     * Search users by username or display name.
     * @param query - The search query
     * @returns Array of matching users
     */
    searchUsers(query: string): Promise<User[]>;
}
