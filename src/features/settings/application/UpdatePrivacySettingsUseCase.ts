import { PrivacyRepository } from '../domain/PrivacyRepository';
import { PrivacySettings, VisibilityLevel } from '../domain/PrivacySettings';

interface UpdatePrivacySettingsInput {
    userId: string;
    profileVisibility?: VisibilityLevel;
    scheduleVisibility?: VisibilityLevel;
    activityVisibility?: VisibilityLevel;
}

/**
 * Use case for updating a user's privacy settings
 */
export class UpdatePrivacySettingsUseCase {
    constructor(private privacyRepository: PrivacyRepository) {}

    /**
     * Update privacy settings for a user
     * @param input - The settings to update
     */
    async execute(input: UpdatePrivacySettingsInput): Promise<void> {
        const { userId, ...settings } = input;

        await this.privacyRepository.updatePrivacySettings(userId, settings);
    }
}

