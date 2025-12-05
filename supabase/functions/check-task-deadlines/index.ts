
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { addMinutes, format, isAfter, isBefore, isPast } from 'https://esm.sh/date-fns@2.30.0'

// TODO: Replace with your Make.com Webhook URL
const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/aicli8bodf36n9loj9mqtozc8c9unb0r";

interface Task {
  id: string;
  title: string;
  date: string; // ISO string in Supabase
  startTime: string; // "HH:MM"
  duration: number; // minutes
  userId: string;
  status: 'pending' | 'completed' | 'overdue';
}

Deno.serve(async (req) => {
  // Create a Supabase client with the Auth context of the logged in user.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? 'https://xwxihepzobxawdrftwbj.supabase.co',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3eGloZXB6b2J4YXdkcmZ0d2JqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg0NDIzOCwiZXhwIjoyMDgwNDIwMjM4fQ.mojUd0OJCMAJFUmp7zNGeFApRhx_t7eX6OWi34twqWY'
)

  const now = new Date();
  const fifteenMinutesFromNow = addMinutes(now, 15);
  const twoMinutesAgo = addMinutes(now, -2);

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  try {
    // Fetch all pending tasks for today and future (or just today/yesterday as in original)
    // In Supabase, we can filter by date.
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'pending')
      .gte('date', startOfToday.toISOString());

    if (error) {
      throw error;
    }

    const notifications = [];
    const updates = [];

    for (const task of tasks as Task[]) {
      // 1. Calculate the precise deadline
      // task.date is likely YYYY-MM-DD or ISO string.
      // We need to combine task.date and task.startTime
      const taskDate = new Date(task.date);
      const [hours, minutes] = task.startTime.split(':').map(Number);
      const startTimeDate = new Date(taskDate);
      startTimeDate.setHours(hours, minutes, 0, 0);
      const deadline = addMinutes(startTimeDate, task.duration);

      // 2. Check for "15-Minute Reminder"
      if (isAfter(deadline, now) && isBefore(deadline, fifteenMinutesFromNow)) {
        notifications.push(processNotification(supabase, task, deadline, 'REMINDER'));
      }

      // 3. Check for "Overdue Alert"
      else if (isPast(deadline) && isAfter(deadline, twoMinutesAgo)) {
        notifications.push(processNotification(supabase, task, deadline, 'OVERDUE'));

        // Update status
        updates.push(
          supabase.from('tasks').update({ status: 'overdue' }).eq('id', task.id)
        );
      }
    }

    await Promise.all([...notifications, ...updates]);

    return new Response(
      JSON.stringify({ message: `Checked ${tasks.length} tasks.` }),
      { headers: { "Content-Type": "application/json" } },
    )

  } catch (error) {
    console.error("Error checking task deadlines:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
})

async function processNotification(supabase: any, task: Task, deadline: Date, type: 'REMINDER' | 'OVERDUE') {
  try {
    // Fetch user email
    // Assuming 'users' table or auth.users (requires admin)
    // If using public.users table:
    const { data: userData, error } = await supabase
      .from('users')
      .select('email, displayName')
      .eq('id', task.userId)
      .single();

    if (error || !userData || !userData.email) {
      console.log(`User not found or no email for task ${task.id}`);
      return;
    }

    if (MAKE_WEBHOOK_URL.includes("YOUR_WEBHOOK_ID")) {
      console.error("Make.com Webhook URL not configured.");
      return;
    }

    await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userData.email,
        taskTitle: task.title,
        deadline: format(deadline, "yyyy-MM-dd HH:mm"),
        userName: userData.displayName || "User",
        taskId: task.id,
        notificationType: type
      })
    });

    console.log(`${type} sent for task ${task.id} to ${userData.email}`);
  } catch (error) {
    console.error(`Failed to send notification for task ${task.id}`, error);
  }
}
