import { useState, useEffect } from 'react';
import { Task } from '@/features/shells/domain/Task';
import { GetWeeklyTasksUseCase } from '@/features/shells/application/GetWeeklyTasksUseCase';
import { taskRepository } from '@/features/shells/infrastructure';

const getWeeklyTasksUseCase = new GetWeeklyTasksUseCase(taskRepository);

/**
 * Hook to fetch weekly tasks for a user (current week: Monday-Sunday).
 * @param userId - The user ID to fetch tasks for
 */
export function useWeeklyTasks(userId: string | undefined) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const fetchTasks = async () => {
            try {
                setLoading(true);
                setError(null);
                const fetchedTasks = await getWeeklyTasksUseCase.execute(userId);
                setTasks(fetchedTasks);
            } catch (err) {
                console.error('Error fetching weekly tasks:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch weekly tasks');
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [userId]);

    return { tasks, loading, error };
}
