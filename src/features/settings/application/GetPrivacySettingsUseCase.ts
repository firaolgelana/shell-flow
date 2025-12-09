import { PrivacyRepository } from '../domain/PrivacyRepository';
import { PrivacySettings, DEFAULT_PRIVACY_SETTINGS } from '../domain/PrivacySettings';

/**
 * Use case for getting a user's privacy settings
 */
export class GetPrivacySettingsUseCase {
    constructor(private privacyRepository: PrivacyRepository) {}

    /**
     * Get privacy settings for a user, returning defaults if not set
     * @param userId - The user's ID
     * @returns Privacy settings with defaults applied
     */
    async execute(userId: string): Promise<PrivacySettings> {
        const settings = await this.privacyRepository.getPrivacySettings(userId);

        if (!settings) {
            // Return default settings
            return {
                userId,
                ...DEFAULT_PRIVACY_SETTINGS,
                updatedAt: new Date().toISOString(),
            };
        }

        return settings;
    }
}

