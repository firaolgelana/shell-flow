
import { Task } from '@/features/shells/domain/Task';
import { TaskRepository } from '@/features/shells/domain/TaskRepository';
import { supabase } from '@/shared/config/supabase';

export class SupabaseTaskRepository implements TaskRepository {
    private tableName = 'tasks';

    private mapSupabaseTaskToTask(data: any): Task {
        return {
            id: data.id,
            title: data.title,
            description: data.description,
            date: new Date(data.date),
            startTime: data.start_time || '09:00',
            duration: data.duration || 30,
            userId: data.user_id,
            createdAt: new Date(data.created_at),
            category: data.category || 'work',
            status: data.status || 'pending',
        };
    }

    async getTasks(userId: string): Promise<Task[]> {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        return data.map(this.mapSupabaseTaskToTask);
    }

    async getRecentTasks(userId: string, limitCount: number = 5): Promise<Task[]> {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limitCount);

        if (error) throw error;
        return data.map(this.mapSupabaseTaskToTask);
    }

    async createTask(task: Task): Promise<void> {
        const { error } = await supabase
            .from(this.tableName)
            .insert({
                title: task.title,
                description: task.description,
                date: task.date.toISOString(),
                start_time: task.startTime,
                duration: task.duration,
                user_id: task.userId,
                created_at: task.createdAt.toISOString(),
                category: task.category,
                status: task.status,
            });

        if (error) throw error;
    }

    async updateTaskStatus(taskId: string, status: Task['status']): Promise<void> {
        const { error } = await supabase
            .from(this.tableName)
            .update({ status })
            .eq('id', taskId);

        if (error) throw error;
    }

    async getTasksByDate(userId: string, date: Date): Promise<Task[]> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return this.getTasksByDateRange(userId, startOfDay, endOfDay);
    }

    async getTasksByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Task[]> {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('user_id', userId)
            .gte('date', startDate.toISOString())
            .lte('date', endDate.toISOString());

        if (error) throw error;
        return data.map(this.mapSupabaseTaskToTask);
    }
}
