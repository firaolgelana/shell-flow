import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import axios from "axios";
import { addMinutes, format, isAfter, isBefore, isPast } from "date-fns"; // isWithinInterval is removed

admin.initializeApp();
const db = admin.firestore();

// TODO: Replace with your Make.com Webhook URL
const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/aicli8bodf36n9loj9mqtozc8c9unb0r";

interface Task {
    id: string;
    title: string;
    // ... other task fields
    date: admin.firestore.Timestamp;
    startTime: string; // "HH:MM"
    duration: number; // minutes
    userId: string;
    status: 'pending' | 'completed' | 'overdue';
}

export const checkTaskDeadlines = onSchedule("every 1 minutes", async () => {
    const now = new Date();
    const fifteenMinutesFromNow = addMinutes(now, 15);
    const twoMinutesAgo = addMinutes(now, -2); // Check for tasks that *just* became overdue

    // For better efficiency, only check tasks whose 'date' is today or was yesterday
    // The exact range depends on your task entry system, but for simplicity, fetching for today is okay if your task date is accurate.
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    try {
        // Fetch all pending tasks for today and yesterday for a safety net
        const tasksSnapshot = await db.collection("tasks")
            .where("status", "==", "pending")
            .where("date", ">=", startOfToday)
            .get();

        const notifications = [];
        const batch = db.batch(); // For marking tasks as overdue

        for (const doc of tasksSnapshot.docs) {
            const task = doc.data() as Task;
            const taskRef = doc.ref;

            // 1. Calculate the precise deadline
            const taskDate = task.date.toDate();
            const [hours, minutes] = task.startTime.split(':').map(Number);
            const startTimeDate = new Date(taskDate);
            startTimeDate.setHours(hours, minutes, 0, 0);
            const deadline = addMinutes(startTimeDate, task.duration);


            // 2. Check for "15-Minute Reminder" (Deadline between now and 15 minutes from now)
            if (isAfter(deadline, now) && isBefore(deadline, fifteenMinutesFromNow)) {
                notifications.push(processNotification(task, deadline, 'REMINDER'));
            }
            
            // 3. Check for "Overdue Alert" (Deadline is past, and it wasn't overdue 2 minutes ago)
            // This ensures we catch it *right* when it passes the deadline and only once.
            else if (isPast(deadline) && isAfter(deadline, twoMinutesAgo)) {
                // a) Add to notifications
                notifications.push(processNotification(task, deadline, 'OVERDUE'));
                
                // b) Update status in a batch to prevent repeat notifications
                batch.update(taskRef, { status: 'overdue' });
            }
        }

        // Send all notifications concurrently
        await Promise.all(notifications);
        // Commit the batch update to Firestore
        await batch.commit();

        console.log(`Checked ${tasksSnapshot.size} tasks. Sent ${notifications.length} notifications. Updated ${tasksSnapshot.size - notifications.length} tasks to overdue.`);

    } catch (error) {
        console.error("Error checking task deadlines:", error);
    }
});

async function processNotification(task: Task, deadline: Date, type: 'REMINDER' | 'OVERDUE') {
    try {
        const userDoc = await db.collection("users").doc(task.userId).get();
        const userData = userDoc.data();

        if (!userData || !userData.email) {
            console.log(`User not found or no email for task ${task.id}`);
            return;
        }

        if (MAKE_WEBHOOK_URL.includes("YOUR_WEBHOOK_ID")) {
            console.error("Make.com Webhook URL not configured.");
            return;
        }

        await axios.post(MAKE_WEBHOOK_URL, {
            email: userData.email,
            taskTitle: task.title,
            deadline: format(deadline, "yyyy-MM-dd HH:mm"),
            userName: userData.displayName || "User",
            taskId: task.id,
            notificationType: type // Send the type to Make.com
        });

        console.log(`${type} sent for task ${task.id} to ${userData.email}`);
    } catch (error) {
        console.error(`Failed to send notification for task ${task.id}`, error);
    }
}