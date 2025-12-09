import { User } from '@/features/auth/domain/User';
import { PrivacyRepository } from '../domain/PrivacyRepository';
import {
    PrivacySettings,
    ProfileSection,
    ViewableSections,
    DEFAULT_PRIVACY_SETTINGS,
} from '../domain/PrivacySettings';
import { supabase } from '@/shared/config/supabase';

/**
 * Supabase implementation of the PrivacyRepository
 */
export class SupabasePrivacyRepository implements PrivacyRepository {
    private privacySettingsTable = 'privacy_settings';
    private customVisibilityTable = 'custom_visibility';
    private profilesTable = 'profiles';

    async getPrivacySettings(userId: string): Promise<PrivacySettings | null> {
        const { data, error } = await supabase
            .from(this.privacySettingsTable)
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            // If no row found, return null (will use defaults)
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('Error fetching privacy settings:', error);
            throw error;
        }

        return {
            userId: data.user_id,
            profileVisibility: data.profile_visibility,
            scheduleVisibility: data.schedule_visibility,
            activityVisibility: data.activity_visibility,
            updatedAt: data.updated_at,
        };
    }

    async updatePrivacySettings(
        userId: string,
        settings: Partial<Omit<PrivacySettings, 'userId' | 'updatedAt'>>
    ): Promise<void> {
        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };

        if (settings.profileVisibility !== undefined) {
            updateData.profile_visibility = settings.profileVisibility;
        }
        if (settings.scheduleVisibility !== undefined) {
            updateData.schedule_visibility = settings.scheduleVisibility;
        }
        if (settings.activityVisibility !== undefined) {
            updateData.activity_visibility = settings.activityVisibility;
        }

        // Try to upsert - insert if not exists, update if exists
        const { error } = await supabase
            .from(this.privacySettingsTable)
            .upsert({
                user_id: userId,
                profile_visibility: settings.profileVisibility ?? DEFAULT_PRIVACY_SETTINGS.profileVisibility,
                schedule_visibility: settings.scheduleVisibility ?? DEFAULT_PRIVACY_SETTINGS.scheduleVisibility,
                activity_visibility: settings.activityVisibility ?? DEFAULT_PRIVACY_SETTINGS.activityVisibility,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id',
            });

        if (error) {
            console.error('Error updating privacy settings:', error);
            throw error;
        }
    }

    async getCustomAllowedUsers(userId: string, section: ProfileSection): Promise<User[]> {
        // Get allowed user IDs
        const { data: customEntries, error: entriesError } = await supabase
            .from(this.customVisibilityTable)
            .select('allowed_user_id')
            .eq('owner_id', userId)
            .eq('section', section);

        if (entriesError) {
            console.error('Error fetching custom visibility entries:', entriesError);
            throw entriesError;
        }

        if (!customEntries || customEntries.length === 0) {
            return [];
        }

        // Get user profiles for the allowed users
        const allowedUserIds = customEntries.map(e => e.allowed_user_id);
        const { data: profiles, error: profilesError } = await supabase
            .from(this.profilesTable)
            .select('*')
            .in('id', allowedUserIds);

        if (profilesError) {
            console.error('Error fetching user profiles:', profilesError);
            throw profilesError;
        }

        return (profiles || []).map(p => ({
            id: p.id,
            email: p.email,
            displayName: p.display_name,
            photoURL: p.photo_url,
            emailVerified: false,
            username: p.username,
            bio: p.bio,
        }));
    }

    async addCustomAllowedUser(
        ownerId: string,
        allowedUserId: string,
        section: ProfileSection
    ): Promise<void> {
        const { error } = await supabase
            .from(this.customVisibilityTable)
            .insert({
                owner_id: ownerId,
                allowed_user_id: allowedUserId,
                section,
            });

        if (error) {
            // Ignore duplicate key errors (user already in list)
            if (error.code === '23505') {
                return;
            }
            console.error('Error adding custom allowed user:', error);
            throw error;
        }
    }

    async removeCustomAllowedUser(
        ownerId: string,
        allowedUserId: string,
        section: ProfileSection
    ): Promise<void> {
        const { error } = await supabase
            .from(this.customVisibilityTable)
            .delete()
            .eq('owner_id', ownerId)
            .eq('allowed_user_id', allowedUserId)
            .eq('section', section);

        if (error) {
            console.error('Error removing custom allowed user:', error);
            throw error;
        }
    }

    async canViewSection(
        viewerId: string | null,
        profileOwnerId: string,
        section: ProfileSection
    ): Promise<boolean> {
        // Anonymous users can only see public content
        if (!viewerId) {
            const settings = await this.getPrivacySettings(profileOwnerId);
            const visibility = this.getVisibilityForSection(settings, section);
            return visibility === 'public';
        }

        // Use the database RPC function for authenticated users
        const { data, error } = await supabase.rpc('can_view_profile_section', {
            viewer_id: viewerId,
            profile_owner_id: profileOwnerId,
            section_name: section,
        });

        if (error) {
            console.error('Error checking section visibility:', error);
            // Default to false on error for security
            return false;
        }

        return data === true;
    }

    async getViewableSections(
        viewerId: string | null,
        profileOwnerId: string
    ): Promise<ViewableSections> {
        // For anonymous users, check each section based on public visibility
        if (!viewerId) {
            const settings = await this.getPrivacySettings(profileOwnerId);
            return {
                canViewProfile: this.getVisibilityForSection(settings, 'profile') === 'public',
                canViewSchedule: this.getVisibilityForSection(settings, 'schedule') === 'public',
                canViewActivity: this.getVisibilityForSection(settings, 'activity') === 'public',
            };
        }

        // Use the database RPC function for authenticated users
        const { data, error } = await supabase.rpc('get_viewable_sections', {
            viewer_id: viewerId,
            profile_owner_id: profileOwnerId,
        });

        if (error) {
            console.error('Error getting viewable sections:', error);
            // Default to restrictive on error
            return {
                canViewProfile: false,
                canViewSchedule: false,
                canViewActivity: false,
            };
        }

        // The RPC returns an array with one row
        const result = Array.isArray(data) ? data[0] : data;
        
        return {
            canViewProfile: result?.can_view_profile ?? false,
            canViewSchedule: result?.can_view_schedule ?? false,
            canViewActivity: result?.can_view_activity ?? false,
        };
    }

    /**
     * Helper to get visibility setting for a section, with defaults
     */
    private getVisibilityForSection(
        settings: PrivacySettings | null,
        section: ProfileSection
    ): string {
        if (!settings) {
            return DEFAULT_PRIVACY_SETTINGS[`${section}Visibility` as keyof typeof DEFAULT_PRIVACY_SETTINGS] as string;
        }

        switch (section) {
            case 'profile':
                return settings.profileVisibility;
            case 'schedule':
                return settings.scheduleVisibility;
            case 'activity':
                return settings.activityVisibility;
            default:
                return 'private';
        }
    }
}

