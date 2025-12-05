'use client';

import { useState, useEffect, useCallback } from 'react';
import { followRepository } from '../../infrastructure';
import { FollowUserUseCase } from '../../application/FollowUserUseCase';
import { UnfollowUserUseCase } from '../../application/UnfollowUserUseCase';
import { GetFollowStatsUseCase, FollowStats } from '../../application/GetFollowStatsUseCase';

const followUserUseCase = new FollowUserUseCase(followRepository);
const unfollowUserUseCase = new UnfollowUserUseCase(followRepository);
const getFollowStatsUseCase = new GetFollowStatsUseCase(followRepository);

export function useFollow(currentUserId: string | undefined, targetUserId: string | undefined) {
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<FollowStats>({ followerCount: 0, followingCount: 0 });
    const [error, setError] = useState<string | null>(null);

    // Check if following
    useEffect(() => {
        if (!currentUserId || !targetUserId) return;

        const checkFollowStatus = async () => {
            try {
                const following = await followRepository.isFollowing(currentUserId, targetUserId);
                setIsFollowing(following);
            } catch (err) {
                console.error('Error checking follow status:', err);
            }
        };

        checkFollowStatus();
    }, [currentUserId, targetUserId]);

    // Get follow stats
    useEffect(() => {
        if (!targetUserId) return;

        const fetchStats = async () => {
            try {
                const followStats = await getFollowStatsUseCase.execute(targetUserId);
                setStats(followStats);
            } catch (err) {
                console.error('Error fetching follow stats:', err);
            }
        };

        fetchStats();
    }, [targetUserId]);

    const followUser = useCallback(async () => {
        if (!currentUserId || !targetUserId) return;

        setLoading(true);
        setError(null);

        try {
            await followUserUseCase.execute(currentUserId, targetUserId);
            setIsFollowing(true);
            setStats(prev => ({ ...prev, followerCount: prev.followerCount + 1 }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to follow user';
            setError(errorMessage);
            console.error('Error following user:', err);
        } finally {
            setLoading(false);
        }
    }, [currentUserId, targetUserId]);

    const unfollowUser = useCallback(async () => {
        if (!currentUserId || !targetUserId) return;

        setLoading(true);
        setError(null);

        try {
            await unfollowUserUseCase.execute(currentUserId, targetUserId);
            setIsFollowing(false);
            setStats(prev => ({ ...prev, followerCount: Math.max(0, prev.followerCount - 1) }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to unfollow user';
            setError(errorMessage);
            console.error('Error unfollowing user:', err);
        } finally {
            setLoading(false);
        }
    }, [currentUserId, targetUserId]);

    const toggleFollow = useCallback(async () => {
        if (isFollowing) {
            await unfollowUser();
        } else {
            await followUser();
        }
    }, [isFollowing, followUser, unfollowUser]);

    return {
        isFollowing,
        loading,
        error,
        stats,
        followUser,
        unfollowUser,
        toggleFollow,
    };
}
