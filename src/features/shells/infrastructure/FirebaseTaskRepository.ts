import { Task } from '@/features/shells/domain/Task';
import { TaskRepository } from '@/features/shells/domain/TaskRepository';
import { db } from '@/features/auth/infrastructure/firebase/firebaseConfig';
import { collection, query, where, getDocs, addDoc, Timestamp, orderBy, limit } from 'firebase/firestore';

/**
 * Firebase implementation of the TaskRepository.
 */
export class FirebaseTaskRepository implements TaskRepository {
    private collectionName = 'tasks';

    /**
     * Retrieves all tasks for a specific user from Firestore.
     * @param userId The ID of the user.
     * @returns A promise that resolves to an array of Tasks.
     */
    async getTasks(userId: string): Promise<Task[]> {
        const tasksRef = collection(db, this.collectionName);
        const q = query(tasksRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                description: data.description,
                date: (data.date as Timestamp).toDate(),
                startTime: data.startTime || '09:00',
                duration: data.duration || 30,
                userId: data.userId,
                createdAt: (data.createdAt as Timestamp).toDate(),
            } as Task;
        });
    }

    /**
     * Retrieves recent tasks for a specific user from Firestore.
     * @param userId The ID of the user.
     * @param limitCount Maximum number of tasks to retrieve.
     * @returns A promise that resolves to an array of Tasks.
     */
    async getRecentTasks(userId: string, limitCount: number = 5): Promise<Task[]> {
        try {
            const tasksRef = collection(db, this.collectionName);
            const q = query(
                tasksRef,
                where('userId', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title,
                    description: data.description,
                    date: (data.date as Timestamp).toDate(),
                    startTime: data.startTime || '09:00',
                    duration: data.duration || 30,
                    userId: data.userId,
                    createdAt: (data.createdAt as Timestamp).toDate(),
                } as Task;
            });
        } catch (error: any) {
            // Check if it's a Firestore index error
            if (error.code === 'failed-precondition' || error.message?.includes('index')) {
                console.warn('Firestore index not created yet. Falling back to unordered query.');
                console.warn('Create the index here: https://console.firebase.google.com/v1/r/project/shellflow/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9zaGVsbGZsb3cvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3Rhc2tzL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI');

                // Fallback: Get all tasks without ordering
                const allTasks = await this.getTasks(userId);
                // Sort in memory and limit
                return allTasks
                    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                    .slice(0, limitCount);
            }
            throw error;
        }
    }

    /**
     * Creates a new task in Firestore.
     * @param task The task to create.
     * @returns A promise that resolves when the task is created.
     */
    async createTask(task: Task): Promise<void> {
        const tasksRef = collection(db, this.collectionName);
        await addDoc(tasksRef, {
            title: task.title,
            description: task.description,
            date: Timestamp.fromDate(task.date),
            startTime: task.startTime,
            duration: task.duration,
            userId: task.userId,
            createdAt: Timestamp.fromDate(task.createdAt),
        });
    }
}
