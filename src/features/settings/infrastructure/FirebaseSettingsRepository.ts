import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../auth/infrastructure/firebase/firebaseConfig';
import { SettingsRepository } from '../domain/SettingsRepository';
import { Settings, SecuritySettings, NotificationSettings, UserPreferences } from '../domain/Settings';

export class FirebaseSettingsRepository implements SettingsRepository {
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
        try {
            const settingsRef = doc(db, 'users', userId, 'settings', 'preferences');
            const settingsSnap = await getDoc(settingsRef);

            if (!settingsSnap.exists()) {
                // Return default settings if none exist
                return this.getDefaultSettings(userId);
            }

            return settingsSnap.data() as Settings;
        } catch (error) {
            console.error('Error getting settings:', error);
            // Return default settings on error
            return this.getDefaultSettings(userId);
        }
    }

    async updateSettings(userId: string, settings: Partial<Settings>): Promise<void> {
        try {
            const settingsRef = doc(db, 'users', userId, 'settings', 'preferences');
            const updateData = {
                ...settings,
                userId,
                updatedAt: new Date().toISOString(),
            };

            await setDoc(settingsRef, updateData, { merge: true });
        } catch (error) {
            console.error('Error updating settings:', error);
            throw new Error('Failed to update settings');
        }
    }

    async resetSettings(userId: string): Promise<void> {
        try {
            const settingsRef = doc(db, 'users', userId, 'settings', 'preferences');
            const defaultSettings = this.getDefaultSettings(userId);
            await setDoc(settingsRef, defaultSettings);
        } catch (error) {
            console.error('Error resetting settings:', error);
            throw new Error('Failed to reset settings');
        }
    }
}
