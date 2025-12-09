import { SupabaseSettingsRepository } from './SupabaseSettingsRepository';
import { SupabasePrivacyRepository } from './SupabasePrivacyRepository';

export const settingsRepository = new SupabaseSettingsRepository();
export const privacyRepository = new SupabasePrivacyRepository();
