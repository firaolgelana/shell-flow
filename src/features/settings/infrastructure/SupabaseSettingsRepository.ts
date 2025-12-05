import { supabase } from '@/shared/config/supabase';
import { SettingsRepository } from '../domain/SettingsRepository';
import { Settings, SecuritySettings, NotificationSettings, UserPreferences } from '../domain/Settings';

export class SupabaseSettingsRepository implements SettingsRepository {
    private tableName = 'settings';

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
            security: {
                hasPasswordLinked: false, // Not stored in settings table
                twoFactorEnabled: false,
                emailVerified: false,
            },
            notifications: {
                emailNotifications: data.email_notifications,
                pushNotifications: data.push_notifications,
                taskReminders: data.task_reminders,
                weeklyDigest: data.weekly_digest,
            },
            preferences: {
                theme: data.theme as 'light' | 'dark' | 'system',
                language: data.language,
                timezone: data.timezone,
            },
            updatedAt: data.updated_at,
        };
    }

    async updateSettings(userId: string, settings: Partial<Settings>): Promise<void> {
        const updateData: any = {
            user_id: userId,
            updated_at: new Date().toISOString(),
        };

        if (settings.notifications) {
            if (settings.notifications.emailNotifications !== undefined) updateData.email_notifications = settings.notifications.emailNotifications;
            if (settings.notifications.pushNotifications !== undefined) updateData.push_notifications = settings.notifications.pushNotifications;
            if (settings.notifications.taskReminders !== undefined) updateData.task_reminders = settings.notifications.taskReminders;
            if (settings.notifications.weeklyDigest !== undefined) updateData.weekly_digest = settings.notifications.weeklyDigest;
        }

        if (settings.preferences) {
            if (settings.preferences.theme !== undefined) updateData.theme = settings.preferences.theme;
            if (settings.preferences.language !== undefined) updateData.language = settings.preferences.language;
            if (settings.preferences.timezone !== undefined) updateData.timezone = settings.preferences.timezone;
        }

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
