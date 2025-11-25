'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Calendar, Clock, Timer } from 'lucide-react';
import { useCreateTask } from '@/features/shells/presentation/hooks/useCreateTask';
import { useAuth } from '@/features/auth/presentation/useAuth';

interface CreateTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CreateTaskDialog({ open, onOpenChange, onSuccess }: CreateTaskDialogProps) {
    const { user } = useAuth();
    const { createTask, loading, error } = useCreateTask();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('09:00');
    const [duration, setDuration] = useState(30);
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            return;
        }

        try {
            const taskDate = new Date(date);
            await createTask(user.id, title, description, taskDate, startTime, duration);

            setSuccessMessage('Task created successfully!');

            // Reset form
            setTitle('');
            setDescription('');
            setDate(new Date().toISOString().split('T')[0]);
            setStartTime('09:00');
            setDuration(30);

            // Close dialog after a short delay
            setTimeout(() => {
                setSuccessMessage('');
                onOpenChange(false);
                onSuccess?.();
            }, 1500);
        } catch (err) {
            // Error is handled by the hook
            console.error('Failed to create task:', err);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setTitle('');
            setDescription('');
            setDate(new Date().toISOString().split('T')[0]);
            setStartTime('09:00');
            setDuration(30);
            setSuccessMessage('');
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                        Add a new task to your shell. Fill in the details below.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Task Title *</Label>
                        <Input
                            id="title"
                            placeholder="e.g., Morning workout"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={100}
                            required
                            disabled={loading}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Add details about your task..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={500}
                            rows={3}
                            disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                            {description.length}/500 characters
                        </p>
                    </div>

                    {/* Date and Time Row */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Date */}
                        <div className="space-y-2">
                            <Label htmlFor="date" className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Date *
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Start Time */}
                        <div className="space-y-2">
                            <Label htmlFor="startTime" className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Start Time *
                            </Label>
                            <Input
                                id="startTime"
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Duration */}
                    <div className="space-y-2">
                        <Label htmlFor="duration" className="flex items-center gap-2">
                            <Timer className="h-4 w-4" />
                            Duration (minutes) *
                        </Label>
                        <Input
                            id="duration"
                            type="number"
                            min="1"
                            max="1440"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                            required
                            disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                            {duration} minutes ({Math.floor(duration / 60)}h {duration % 60}m)
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {successMessage && (
                        <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {successMessage}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Task'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
