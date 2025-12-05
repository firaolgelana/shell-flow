import { useState, useEffect } from 'react';
import { Task } from '@/features/shells/domain/Task';
import { GetDailyTasksUseCase } from '@/features/shells/application/GetDailyTasksUseCase';
import { taskRepository } from '@/features/shells/infrastructure';

const getDailyTasksUseCase = new GetDailyTasksUseCase(taskRepository);

/**
 * Hook to fetch daily tasks for a user.
 * @param userId - The user ID to fetch tasks for
 * @param date - Optional date to fetch tasks for (defaults to today)
 */
export function useDailyTasks(userId: string | undefined, date?: Date) {
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
                const fetchedTasks = await getDailyTasksUseCase.execute(userId, date);
                setTasks(fetchedTasks);
            } catch (err) {
                console.error('Error fetching daily tasks:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch daily tasks');
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [userId, date?.toISOString()]);

    return { tasks, loading, error };
}
