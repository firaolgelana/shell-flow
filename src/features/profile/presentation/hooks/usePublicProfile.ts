'use client';

import { useState, useEffect } from 'react';
import { User } from '@/features/auth/domain/User';
import { GetUserByUsernameUseCase } from '@/features/profile/application/GetUserByUsernameUseCase';
import { userRepository } from '@/features/profile/infrastructure';

const getUserByUsernameUseCase = new GetUserByUsernameUseCase(userRepository);

/**
 * Hook to fetch a public user profile by username.
 * Used for displaying public profiles at /{username}
 */
export function usePublicProfile(username: string | null) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!username) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const fetchedUser = await getUserByUsernameUseCase.execute(username);
                setUser(fetchedUser);

                if (!fetchedUser) {
                    setError('User not found');
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
                setError(errorMessage);
                console.error('Error fetching public profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [username]);

    return { user, loading, error };
}
