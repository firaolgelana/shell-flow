import { Follow } from '../domain/Follow';
import { FollowRepository } from '../domain/FollowRepository';
import { supabase } from '@/shared/config/supabase';

export class SupabaseFollowRepository implements FollowRepository {
    private tableName = 'follows';

    async followUser(followerId: string, followingId: string): Promise<void> {
        if (followerId === followingId) {
            throw new Error('Cannot follow yourself');
        }

        // Check if already following
        const isAlreadyFollowing = await this.isFollowing(followerId, followingId);
        if (isAlreadyFollowing) {
            return;
        }

        const { error } = await supabase
            .from(this.tableName)
            .insert({
                follower_id: followerId,
                following_id: followingId,
                created_at: new Date().toISOString(),
            });

        if (error) throw error;
    }

    async unfollowUser(followerId: string, followingId: string): Promise<void> {
        const { error } = await supabase
            .from(this.tableName)
            .delete()
            .eq('follower_id', followerId)
            .eq('following_id', followingId);

        if (error) throw error;
    }

    async isFollowing(followerId: string, followingId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('id')
            .eq('follower_id', followerId)
            .eq('following_id', followingId)
            .single();

        return !!data && !error;
    }

    async getFollowers(userId: string): Promise<string[]> {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('follower_id')
            .eq('following_id', userId);

        if (error) throw error;
        return data.map(row => row.follower_id);
    }

    async getFollowing(userId: string): Promise<string[]> {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('following_id')
            .eq('follower_id', userId);

        if (error) throw error;
        return data.map(row => row.following_id);
    }

    async getFollowerCount(userId: string): Promise<number> {
        const { count, error } = await supabase
            .from(this.tableName)
            .select('*', { count: 'exact', head: true })
            .eq('following_id', userId);

        if (error) throw error;
        return count || 0;
    }

    async getFollowingCount(userId: string): Promise<number> {
        const { count, error } = await supabase
            .from(this.tableName)
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', userId);

        if (error) throw error;
        return count || 0;
    }
}
