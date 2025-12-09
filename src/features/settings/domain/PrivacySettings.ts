/**
 * Privacy visibility levels for profile sections
 */
export type VisibilityLevel = 'public' | 'friends' | 'custom' | 'private';

/**
 * Profile sections that can have visibility controls
 */
export type ProfileSection = 'profile' | 'schedule' | 'activity';

/**
 * Privacy settings for a user's profile
 */
export interface PrivacySettings {
    userId: string;
    profileVisibility: VisibilityLevel;
    scheduleVisibility: VisibilityLevel;
    activityVisibility: VisibilityLevel;
    updatedAt: string;
}

/**
 * Default privacy settings for new users
 */
export const DEFAULT_PRIVACY_SETTINGS: Omit<PrivacySettings, 'userId' | 'updatedAt'> = {
    profileVisibility: 'public',
    scheduleVisibility: 'friends',
    activityVisibility: 'public',
};

/**
 * A user in the custom visibility list
 */
export interface CustomVisibilityEntry {
    id: string;
    ownerId: string;
    allowedUserId: string;
    section: ProfileSection;
    createdAt: string;
}

/**
 * Result of checking what sections a viewer can see
 */
export interface ViewableSections {
    canViewProfile: boolean;
    canViewSchedule: boolean;
    canViewActivity: boolean;
}

/**
 * Human-readable labels for visibility levels
 */
export const VISIBILITY_LABELS: Record<VisibilityLevel, string> = {
    public: 'Public',
    friends: 'Friends Only',
    custom: 'Custom List',
    private: 'Private',
};

/**
 * Human-readable descriptions for visibility levels
 */
export const VISIBILITY_DESCRIPTIONS: Record<VisibilityLevel, string> = {
    public: 'Anyone can see this',
    friends: 'Only mutual followers can see this',
    custom: 'Only selected users can see this',
    private: 'Only you can see this',
};

