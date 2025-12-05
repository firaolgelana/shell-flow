import { useState, useEffect } from 'react';
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

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const fetchFollowing = async () => {
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
        };

        fetchFollowing();
    }, [userId]);

    return { following, loading, error };
}
