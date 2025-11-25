import { Task } from '@/features/profile/domain/Task';
import { TaskRepository } from '@/features/profile/domain/TaskRepository';
import { db } from '@/features/auth/infrastructure/firebase/firebaseConfig';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';

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
