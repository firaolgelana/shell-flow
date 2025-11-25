import { SettingsRepository } from '../domain/SettingsRepository';
import { Settings } from '../domain/Settings';

export class UpdateUserSettingsUseCase {
    constructor(private settingsRepository: SettingsRepository) { }

    async execute(userId: string, settings: Partial<Settings>): Promise<void> {
        await this.settingsRepository.updateSettings(userId, settings);
    }
}
