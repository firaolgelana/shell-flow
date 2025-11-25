'use client';

import { useState } from 'react';
import { CreateTaskUseCase } from '@/features/profile/application/CreateTaskUseCase';
import { FirebaseTaskRepository } from '@/features/profile/infrastructure/FirebaseTaskRepository';

const taskRepository = new FirebaseTaskRepository();
const createTaskUseCase = new CreateTaskUseCase(taskRepository);

export function useCreateTask() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createTask = async (
        userId: string,
        title: string,
        description: string,
        date: Date,
        startTime: string,
        duration: number
    ) => {
        setLoading(true);
        setError(null);

        try {
            await createTaskUseCase.execute(userId, title, description, date, startTime, duration);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        createTask,
        loading,
        error,
    };
}
