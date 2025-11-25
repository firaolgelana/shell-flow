'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/features/shells/domain/Task';
import { GetRecentTasksUseCase } from '@/features/shells/application/GetRecentTasksUseCase';
import { FirebaseTaskRepository } from '@/features/shells/infrastructure/FirebaseTaskRepository';

const taskRepository = new FirebaseTaskRepository();
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
