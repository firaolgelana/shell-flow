/**
 * Domain entity representing a Task.
 * Pure TypeScript, no dependencies.
 */
export interface Task {
    id: string;
    title: string;
    description: string;
    date: Date;
    startTime: string; // Format: "HH:MM" (24-hour)
    duration: number; // Duration in minutes
    userId: string;
    createdAt: Date;
}
