'use client';

import { useState, useEffect, useCallback } from 'react';
import { Settings } from '../../domain/Settings';
import { settingsRepository } from '../../infrastructure';
import { GetUserSettingsUseCase } from '../../application/GetUserSettingsUseCase';
import { UpdateUserSettingsUseCase } from '../../application/UpdateUserSettingsUseCase';

export function useSettings(userId: string | undefined) {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSettings = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const getUseCase = new GetUserSettingsUseCase(settingsRepository);
            const userSettings = await getUseCase.execute(userId);
            setSettings(userSettings);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load settings';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const updateSettings = useCallback(async (updates: Partial<Settings>) => {
        if (!userId) return { success: false, error: 'No user ID' };

        try {
            setError(null);
            const updateUseCase = new UpdateUserSettingsUseCase(settingsRepository);
            await updateUseCase.execute(userId, updates);

            // Reload settings after update
            await loadSettings();
            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, [userId, loadSettings]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    return {
        settings,
        loading,
        error,
        updateSettings,
        reloadSettings: loadSettings,
    };
}
