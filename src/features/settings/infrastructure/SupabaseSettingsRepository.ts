import { supabase } from '@/shared/config/supabase';
import { SettingsRepository } from '../domain/SettingsRepository';
import { Settings, SecuritySettings, NotificationSettings, UserPreferences } from '../domain/Settings';

export class SupabaseSettingsRepository implements SettingsRepository {
    private tableName = 'user_settings';

    private getDefaultSettings(userId: string): Settings {
        return {
            userId,
            security: {
                hasPasswordLinked: false,
                twoFactorEnabled: false,
                emailVerified: false,
            },
            notifications: {
                emailNotifications: true,
                pushNotifications: true,
                taskReminders: true,
                weeklyDigest: true,
            },
            preferences: {
                theme: 'system',
                language: 'en',
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            updatedAt: new Date().toISOString(),
        };
    }

    async getSettings(userId: string): Promise<Settings> {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            return this.getDefaultSettings(userId);
        }

        return {
            userId: data.user_id,
            security: data.security,
            notifications: data.notifications,
            preferences: data.preferences,
            updatedAt: data.updated_at,
        };
    }

    async updateSettings(userId: string, settings: Partial<Settings>): Promise<void> {
        const updateData: any = {
            user_id: userId,
            updated_at: new Date().toISOString(),
        };

        if (settings.security) updateData.security = settings.security;
        if (settings.notifications) updateData.notifications = settings.notifications;
        if (settings.preferences) updateData.preferences = settings.preferences;

        const { error } = await supabase
            .from(this.tableName)
            .upsert(updateData);

        if (error) throw new Error('Failed to update settings');
    }

    async resetSettings(userId: string): Promise<void> {
        const defaultSettings = this.getDefaultSettings(userId);
        await this.updateSettings(userId, defaultSettings);
    }
}
