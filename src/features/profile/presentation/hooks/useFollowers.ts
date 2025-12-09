import { useState, useEffect, useCallback } from 'react';
import { User } from '@/features/auth/domain/User';
import { GetFollowersWithDetailsUseCase } from '@/features/social/application/GetFollowersWithDetailsUseCase';
import { followRepository } from '@/features/social/infrastructure';
import { userRepository } from '@/features/profile/infrastructure';

const getFollowersUseCase = new GetFollowersWithDetailsUseCase(followRepository, userRepository);

/**
 * Hook to fetch followers with full user details.
 * @param userId - The user ID to fetch followers for
 */
export function useFollowers(userId: string | undefined) {
    const [followers, setFollowers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFollowers = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            const fetchedFollowers = await getFollowersUseCase.execute(userId);
            setFollowers(fetchedFollowers);
        } catch (err) {
            console.error('Error fetching followers:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch followers');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchFollowers();
    }, [fetchFollowers]);

    return { followers, loading, error, refetch: fetchFollowers };
}
