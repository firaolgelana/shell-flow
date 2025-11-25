'use client';

import { useState } from 'react';
import { Plus, CalendarDays, Sparkles, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { CreateTaskDialog } from '@/features/shells/presentation/components/CreateTaskDialog';

export function QuickActions() {
    const [createTaskOpen, setCreateTaskOpen] = useState(false);

    const handleTaskCreated = () => {
        // Optionally refresh tasks or show a notification
        console.log('Task created successfully!');
    };

    return (
        <>
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Button
                        className="w-full gap-2"
                        size="lg"
                        onClick={() => setCreateTaskOpen(true)}
                    >
                        <Plus className="h-4 w-4" />
                        Add New Task
                    </Button>
                    <Button variant="outline" className="w-full gap-2" size="lg">
                        <CalendarDays className="h-4 w-4" />
                        Create Weekly Plan
                    </Button>
                    <Button variant="secondary" className="w-full gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100 hover:bg-purple-200 dark:hover:bg-purple-900/50" size="lg">
                        <Sparkles className="h-4 w-4" />
                        Auto-Schedule
                    </Button>
                    <Button variant="ghost" className="w-full gap-2" size="lg">
                        <CalendarIcon className="h-4 w-4" />
                        View Calendar
                    </Button>
                </CardContent>
            </Card>

            <CreateTaskDialog
                open={createTaskOpen}
                onOpenChange={setCreateTaskOpen}
                onSuccess={handleTaskCreated}
            />
        </>
    );
}
