export interface Settings {
    userId: string;
    security: SecuritySettings;
    notifications: NotificationSettings;
    preferences: UserPreferences;
    updatedAt: string;
}

export interface SecuritySettings {
    hasPasswordLinked: boolean;
    twoFactorEnabled: boolean;
    emailVerified: boolean;
}

export interface NotificationSettings {
    emailNotifications: boolean;
    pushNotifications: boolean;
    taskReminders: boolean;
    weeklyDigest: boolean;
}

export interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
}
