'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/features/shells/domain/Task';
import { GetRecentTasksUseCase } from '@/features/shells/application/GetRecentTasksUseCase';
import { taskRepository } from '@/features/shells/infrastructure';

const getRecentTasksUseCase = new GetRecentTasksUseCase(taskRepository);

export function useRecentTasks(userId: string | undefined, limit: number = 5) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadTasks = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            setTasks([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const recentTasks = await getRecentTasksUseCase.execute(userId, limit);
            setTasks(recentTasks);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load tasks';
            setError(errorMessage);
            console.error('Error loading tasks:', err);
            if (err && typeof err === 'object' && 'details' in err) {
                console.error('Error details:', (err as any).details);
            }
            if (err && typeof err === 'object' && 'hint' in err) {
                console.error('Error hint:', (err as any).hint);
            }
        } finally {
            setLoading(false);
        }
    }, [userId, limit]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    return {
        tasks,
        loading,
        error,
        reload: loadTasks,
    };
}
