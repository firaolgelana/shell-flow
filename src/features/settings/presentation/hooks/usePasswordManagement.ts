'use client';

import { useState, useCallback } from 'react';
import { authRepository } from '@/features/auth/infrastructure/firebase';
import { LinkPasswordUseCase } from '../../application/LinkPasswordUseCase';
import { UpdatePasswordUseCase } from '../../application/UpdatePasswordUseCase';
import { CheckPasswordLinkedUseCase } from '../../application/CheckPasswordLinkedUseCase';

export function usePasswordManagement() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasPassword, setHasPassword] = useState<boolean | null>(null);

    const checkPasswordLinked = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const checkUseCase = new CheckPasswordLinkedUseCase(authRepository);
            const result = await checkUseCase.execute();
            setHasPassword(result);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to check password status';
            setError(errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const linkPassword = useCallback(async (password: string) => {
        try {
            setLoading(true);
            setError(null);
            const linkUseCase = new LinkPasswordUseCase(authRepository);
            await linkUseCase.execute(password);
            setHasPassword(true);
            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to set password';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, []);

    const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
        try {
            setLoading(true);
            setError(null);
            const updateUseCase = new UpdatePasswordUseCase(authRepository);
            await updateUseCase.execute(currentPassword, newPassword);
            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update password';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        hasPassword,
        checkPasswordLinked,
        linkPassword,
        updatePassword,
    };
}
