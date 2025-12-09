import { User } from '@/features/auth/domain/User';
import { 
    PrivacySettings, 
    ProfileSection, 
    ViewableSections,
    VisibilityLevel 
} from './PrivacySettings';

/**
 * Repository interface for privacy settings operations
 */
export interface PrivacyRepository {
    /**
     * Get privacy settings for a user
     * @param userId - The user's ID
     * @returns Privacy settings or null if not set (will use defaults)
     */
    getPrivacySettings(userId: string): Promise<PrivacySettings | null>;

    /**
     * Update privacy settings for a user
     * @param userId - The user's ID
     * @param settings - Partial privacy settings to update
     */
    updatePrivacySettings(
        userId: string, 
        settings: Partial<Omit<PrivacySettings, 'userId' | 'updatedAt'>>
    ): Promise<void>;

    /**
     * Get all users in the custom visibility list for a section
     * @param userId - The profile owner's ID
     * @param section - The section to get custom list for
     * @returns List of users allowed to view the section
     */
    getCustomAllowedUsers(userId: string, section: ProfileSection): Promise<User[]>;

    /**
     * Add a user to the custom visibility list
     * @param ownerId - The profile owner's ID
     * @param allowedUserId - The user to allow
     * @param section - The section to allow access to
     */
    addCustomAllowedUser(ownerId: string, allowedUserId: string, section: ProfileSection): Promise<void>;

    /**
     * Remove a user from the custom visibility list
     * @param ownerId - The profile owner's ID
     * @param allowedUserId - The user to remove
     * @param section - The section to remove access from
     */
    removeCustomAllowedUser(ownerId: string, allowedUserId: string, section: ProfileSection): Promise<void>;

    /**
     * Check if a viewer can see a specific section of a profile
     * @param viewerId - The viewer's ID (null for anonymous)
     * @param profileOwnerId - The profile owner's ID
     * @param section - The section to check access for
     * @returns Whether the viewer can see the section
     */
    canViewSection(viewerId: string | null, profileOwnerId: string, section: ProfileSection): Promise<boolean>;

    /**
     * Get all viewable sections for a viewer on a profile
     * @param viewerId - The viewer's ID (null for anonymous)
     * @param profileOwnerId - The profile owner's ID
     * @returns Object indicating which sections are viewable
     */
    getViewableSections(viewerId: string | null, profileOwnerId: string): Promise<ViewableSections>;
}

