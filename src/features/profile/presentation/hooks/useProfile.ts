import { useState, useEffect, useCallback } from 'react';
import { User } from '@/features/auth/domain/User';
import { GetUserProfileUseCase } from '@/features/profile/application/GetUserProfileUseCase';
import { authRepository } from '@/features/auth/infrastructure';

/**
 * Hook to fetch and manage the user profile.
 * @returns The user profile, loading state, error state, and refetch function.
 */
export const useProfile = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            const getUserProfileUseCase = new GetUserProfileUseCase(authRepository);
            const currentUser = await getUserProfileUseCase.execute();
            setUser(currentUser);
            setError(null);
        } catch (err) {
            setError('Failed to load profile');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return { user, loading, error, refetch: fetchProfile };
};
