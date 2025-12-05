'use client';

import { useState, useEffect } from 'react';
import { followRepository } from '../../infrastructure';
import { GetFollowStatsUseCase, FollowStats } from '../../application/GetFollowStatsUseCase';

const getFollowStatsUseCase = new GetFollowStatsUseCase(followRepository);

export function useFollowStats(userId: string | undefined) {
    const [stats, setStats] = useState<FollowStats>({ followerCount: 0, followingCount: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const fetchStats = async () => {
            try {
                const followStats = await getFollowStatsUseCase.execute(userId);
                setStats(followStats);
            } catch (err) {
                console.error('Error fetching follow stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [userId]);

    return { stats, loading };
}
