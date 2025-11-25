import { Settings } from './Settings';

export interface SettingsRepository {
    getSettings(userId: string): Promise<Settings>;
    updateSettings(userId: string, settings: Partial<Settings>): Promise<void>;
    resetSettings(userId: string): Promise<void>;
}
