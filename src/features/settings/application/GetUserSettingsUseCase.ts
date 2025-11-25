import { SettingsRepository } from '../domain/SettingsRepository';
import { Settings } from '../domain/Settings';

export class GetUserSettingsUseCase {
    constructor(private settingsRepository: SettingsRepository) { }

    async execute(userId: string): Promise<Settings> {
        return await this.settingsRepository.getSettings(userId);
    }
}
