import { useState } from 'react';
import { UpdateProfileUseCase } from '../../application/UpdateProfileUseCase';
import { userRepository } from '../../infrastructure';

const updateProfileUseCase = new UpdateProfileUseCase(userRepository);

export function useUpdateProfile() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateProfile = async (
        userId: string,
        data: { bio?: string; displayName?: string }
    ): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            await updateProfileUseCase.execute(userId, data);
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
            setError(errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        updateProfile,
        loading,
        error,
    };
}
