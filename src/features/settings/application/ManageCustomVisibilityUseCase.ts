import { User } from '@/features/auth/domain/User';
import { PrivacyRepository } from '../domain/PrivacyRepository';
import { ProfileSection } from '../domain/PrivacySettings';

/**
 * Use case for managing the custom visibility list
 */
export class ManageCustomVisibilityUseCase {
    constructor(private privacyRepository: PrivacyRepository) {}

    /**
     * Get all users in the custom visibility list for a section
     * @param ownerId - The profile owner's ID
     * @param section - The section to get custom list for
     * @returns List of users allowed to view the section
     */
    async getAllowedUsers(ownerId: string, section: ProfileSection): Promise<User[]> {
        return this.privacyRepository.getCustomAllowedUsers(ownerId, section);
    }

    /**
     * Add a user to the custom visibility list
     * @param ownerId - The profile owner's ID
     * @param allowedUserId - The user to allow
     * @param section - The section to allow access to
     */
    async addUser(ownerId: string, allowedUserId: string, section: ProfileSection): Promise<void> {
        await this.privacyRepository.addCustomAllowedUser(ownerId, allowedUserId, section);
    }

    /**
     * Remove a user from the custom visibility list
     * @param ownerId - The profile owner's ID
     * @param allowedUserId - The user to remove
     * @param section - The section to remove access from
     */
    async removeUser(ownerId: string, allowedUserId: string, section: ProfileSection): Promise<void> {
        await this.privacyRepository.removeCustomAllowedUser(ownerId, allowedUserId, section);
    }
}

