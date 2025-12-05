'use client';

import { useState, useCallback } from 'react';
import { Task } from '@/features/shells/domain/Task';
import { UpdateTaskStatusUseCase } from '@/features/shells/application/UpdateTaskStatusUseCase';
import { taskRepository } from '@/features/shells/infrastructure';

const updateTaskStatusUseCase = new UpdateTaskStatusUseCase(taskRepository);

export function useUpdateTaskStatus() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateStatus = useCallback(async (taskId: string, status: Task['status']) => {
        setLoading(true);
        setError(null);

        try {
            await updateTaskStatusUseCase.execute(taskId, status);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update task status';
            setError(errorMessage);
            console.error('Error updating task status:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        updateStatus,
        loading,
        error,
    };
}
