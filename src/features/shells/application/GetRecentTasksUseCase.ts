import { Task } from '../domain/Task';
import { TaskRepository } from '../domain/TaskRepository';

/**
 * Use case for retrieving recent tasks.
 */
export class GetRecentTasksUseCase {
    constructor(private taskRepository: TaskRepository) { }

    /**
     * Executes the use case.
     * @param userId The user ID
     * @param limit Maximum number of tasks to retrieve (default: 5)
     * @returns A promise that resolves to an array of recent Tasks.
     */
    async execute(userId: string, limit: number = 5): Promise<Task[]> {
        if (!userId) {
            throw new Error('User ID is required');
        }

        if (limit <= 0 || limit > 100) {
            throw new Error('Limit must be between 1 and 100');
        }

        return this.taskRepository.getRecentTasks(userId, limit);
    }
}
