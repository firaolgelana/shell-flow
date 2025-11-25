'use client';

import React from 'react';
import { useAuth } from '@/features/auth/presentation/AuthProvider';
import { useSettings } from '../hooks/useSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Bell } from 'lucide-react';

export function NotificationSettings() {
    const { user } = useAuth();
    const { settings, updateSettings } = useSettings(user?.id);

    const handleToggle = async (key: keyof typeof settings.notifications, value: boolean) => {
        if (!settings) return;

        await updateSettings({
            notifications: {
                ...settings.notifications,
                [key]: value,
            },
        });
    };

    if (!settings) return null;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Preferences
                    </CardTitle>
                    <CardDescription>
                        Manage how you receive notifications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="emailNotifications">Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive notifications via email
                            </p>
                        </div>
                        <Switch
                            id="emailNotifications"
                            checked={settings.notifications.emailNotifications}
                            onCheckedChange={(checked) => handleToggle('emailNotifications', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="pushNotifications">Push Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive push notifications in your browser
                            </p>
                        </div>
                        <Switch
                            id="pushNotifications"
                            checked={settings.notifications.pushNotifications}
                            onCheckedChange={(checked) => handleToggle('pushNotifications', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="taskReminders">Task Reminders</Label>
                            <p className="text-sm text-muted-foreground">
                                Get reminders for upcoming tasks
                            </p>
                        </div>
                        <Switch
                            id="taskReminders"
                            checked={settings.notifications.taskReminders}
                            onCheckedChange={(checked) => handleToggle('taskReminders', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="weeklyDigest">Weekly Digest</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive a weekly summary of your tasks
                            </p>
                        </div>
                        <Switch
                            id="weeklyDigest"
                            checked={settings.notifications.weeklyDigest}
                            onCheckedChange={(checked) => handleToggle('weeklyDigest', checked)}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
