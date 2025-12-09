import { useState, useEffect, useCallback } from 'react';
import { User } from '@/features/auth/domain/User';
import { GetFollowingWithDetailsUseCase } from '@/features/social/application/GetFollowingWithDetailsUseCase';
import { followRepository } from '@/features/social/infrastructure';
import { userRepository } from '@/features/profile/infrastructure';

const getFollowingUseCase = new GetFollowingWithDetailsUseCase(followRepository, userRepository);

/**
 * Hook to fetch users that the current user is following, with full details.
 * @param userId - The user ID to fetch following list for
 */
export function useFollowing(userId: string | undefined) {
    const [following, setFollowing] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFollowing = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            const fetchedFollowing = await getFollowingUseCase.execute(userId);
            setFollowing(fetchedFollowing);
        } catch (err) {
            console.error('Error fetching following:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch following');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchFollowing();
    }, [fetchFollowing]);

    return { following, loading, error, refetch: fetchFollowing };
}
