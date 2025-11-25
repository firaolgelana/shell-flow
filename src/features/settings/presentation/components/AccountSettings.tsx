'use client';

import React from 'react';
import { useAuth } from '@/features/auth/presentation/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { User, Mail } from 'lucide-react';

export function AccountSettings() {
    const { user } = useAuth();

    const getInitials = (name?: string) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Account Information
                    </CardTitle>
                    <CardDescription>
                        View and manage your account details
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Profile Picture */}
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user?.photoURL} alt={user?.displayName || 'User'} />
                            <AvatarFallback className="text-lg">
                                {getInitials(user?.displayName)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{user?.displayName || 'User'}</p>
                            <p className="text-sm text-muted-foreground">Profile Picture</p>
                        </div>
                    </div>

                    {/* Display Name */}
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                            id="displayName"
                            value={user?.displayName || ''}
                            disabled
                            className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                            Display name is managed through your authentication provider
                        </p>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Address
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                            Your email address cannot be changed
                        </p>
                    </div>

                    {/* User ID */}
                    <div className="space-y-2">
                        <Label htmlFor="userId">User ID</Label>
                        <Input
                            id="userId"
                            value={user?.id || ''}
                            disabled
                            className="bg-muted font-mono text-xs"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
