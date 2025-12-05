'use client';

import { useState, useCallback } from 'react';
import { UpdateUsernameUseCase } from '@/features/profile/application/UpdateUsernameUseCase';
import { userRepository } from '@/features/profile/infrastructure';
import { validateUsername } from '@/features/profile/utils/usernameValidation';

const updateUsernameUseCase = new UpdateUsernameUseCase(userRepository);

/**
 * Hook to manage username updates.
 * Provides validation and availability checking.
 */
export function useUpdateUsername() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Check if a username is valid (format only, not availability).
     */
    const validateFormat = useCallback((username: string) => {
        return validateUsername(username);
    }, []);

    /**
     * Check if a username is available.
     */
    const checkAvailability = useCallback(async (username: string): Promise<boolean> => {
        try {
            return await userRepository.isUsernameAvailable(username.toLowerCase().trim());
        } catch (err) {
            console.error('Error checking availability:', err);
            return false;
        }
    }, []);

    /**
     * Update the username for a user.
     */
    const updateUsername = async (userId: string, newUsername: string): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            await updateUsernameUseCase.execute(userId, newUsername);
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update username';
            setError(errorMessage);
            console.error('Error updating username:', err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        updateUsername,
        validateFormat,
        checkAvailability,
        loading,
        error,
    };
}
