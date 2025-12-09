import { PrivacyRepository } from '../domain/PrivacyRepository';
import { ProfileSection, ViewableSections } from '../domain/PrivacySettings';

/**
 * Use case for checking if a viewer can access parts of a user's profile
 */
export class CheckProfileAccessUseCase {
    constructor(private privacyRepository: PrivacyRepository) {}

    /**
     * Check if a viewer can see a specific section of a profile
     * @param viewerId - The viewer's ID (null for anonymous)
     * @param profileOwnerId - The profile owner's ID
     * @param section - The section to check
     * @returns Whether the viewer can see the section
     */
    async canViewSection(
        viewerId: string | null,
        profileOwnerId: string,
        section: ProfileSection
    ): Promise<boolean> {
        return this.privacyRepository.canViewSection(viewerId, profileOwnerId, section);
    }

    /**
     * Get all viewable sections for a viewer on a profile
     * @param viewerId - The viewer's ID (null for anonymous)
     * @param profileOwnerId - The profile owner's ID
     * @returns Object indicating which sections are viewable
     */
    async getViewableSections(
        viewerId: string | null,
        profileOwnerId: string
    ): Promise<ViewableSections> {
        return this.privacyRepository.getViewableSections(viewerId, profileOwnerId);
    }
}

