'use client';

import React, { useState } from 'react';
import { useAuth } from '@/features/auth/presentation/AuthProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { SecuritySettings } from '@/features/settings/presentation/components/SecuritySettings';
import { AccountSettings } from '@/features/settings/presentation/components/AccountSettings';
import { NotificationSettings } from '@/features/settings/presentation/components/NotificationSettings';
import { ThemeSettings } from '@/features/settings/presentation/components/ThemeSettings';
import { Shield, User, Bell, Palette, ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('security');

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading settings...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account settings and preferences
                </p>
            </div>

            {/* Settings Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span className="hidden sm:inline">Security</span>
                    </TabsTrigger>
                    <TabsTrigger value="account" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">Account</span>
                    </TabsTrigger>
                    <TabsTrigger value="preferences" className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        <span className="hidden sm:inline">Preferences</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        <span className="hidden sm:inline">Notifications</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="security" className="space-y-6">
                    <SecuritySettings />
                </TabsContent>

                <TabsContent value="account" className="space-y-6">
                    <AccountSettings />
                </TabsContent>

                <TabsContent value="preferences" className="space-y-6">
                    <ThemeSettings />
                </TabsContent>

                <TabsContent value="notifications" className="space-y-6">
                    <NotificationSettings />
                </TabsContent>
            </Tabs>
        </div>
    );
}
