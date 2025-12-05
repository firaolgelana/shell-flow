
import { User } from '@/features/auth/domain/User';
import { UserRepository } from '@/features/profile/domain/UserRepository';
import { supabase } from '@/shared/config/supabase';

export class SupabaseUserRepository implements UserRepository {
    private tableName = 'users';

    private mapSupabaseUserToUser(data: any): User {
        return {
            id: data.id,
            email: data.email,
            displayName: data.display_name || data.displayName,
            photoURL: data.photo_url || data.photoURL,
            emailVerified: false, // Not usually stored in public users table, managed by Auth
            username: data.username,
            bio: data.bio,
        };
    }

    async getUserById(userId: string): Promise<User | null> {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !data) return null;
        return this.mapSupabaseUserToUser(data);
    }

    async getUserByUsername(username: string): Promise<User | null> {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('username', username)
            .single();

        if (error || !data) return null;
        return this.mapSupabaseUserToUser(data);
    }

    async isUsernameAvailable(username: string): Promise<boolean> {
        const user = await this.getUserByUsername(username);
        return user === null;
    }

    async updateUsername(userId: string, username: string): Promise<void> {
        const isAvailable = await this.isUsernameAvailable(username);
        if (!isAvailable) {
            throw new Error('Username is already taken');
        }

        const { error } = await supabase
            .from(this.tableName)
            .update({ username, updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (error) throw error;
    }

    async updateProfile(userId: string, data: { bio?: string; displayName?: string }): Promise<void> {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (data.bio !== undefined) updateData.bio = data.bio;
        if (data.displayName !== undefined) updateData.display_name = data.displayName;

        const { error } = await supabase
            .from(this.tableName)
            .update(updateData)
            .eq('id', userId);

        if (error) throw error;
    }
}
