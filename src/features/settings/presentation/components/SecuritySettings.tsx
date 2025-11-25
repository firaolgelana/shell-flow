'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/features/auth/presentation/AuthProvider';
import { usePasswordManagement } from '../hooks/usePasswordManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { Shield, CheckCircle2, XCircle, Mail } from 'lucide-react';
import { PasswordSettings } from './PasswordSettings';

export function SecuritySettings() {
    const { user } = useAuth();
    const { hasPassword, checkPasswordLinked, loading } = usePasswordManagement();

    useEffect(() => {
        checkPasswordLinked();
    }, [checkPasswordLinked]);

    return (
        <div className="space-y-6">
            {/* Security Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Security Overview
                    </CardTitle>
                    <CardDescription>
                        Manage your account security settings and authentication methods
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Email Verification</p>
                                <p className="text-sm text-muted-foreground">{user?.email}</p>
                            </div>
                        </div>
                        {user?.emailVerified ? (
                            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Verified
                            </Badge>
                        ) : (
                            <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Not Verified
                            </Badge>
                        )}
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Password Authentication</p>
                            <p className="text-sm text-muted-foreground">
                                {hasPassword
                                    ? 'You can sign in with email and password'
                                    : 'Set a password to enable email/password sign-in'}
                            </p>
                        </div>
                        {loading ? (
                            <Badge variant="outline">Checking...</Badge>
                        ) : hasPassword ? (
                            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Enabled
                            </Badge>
                        ) : (
                            <Badge variant="secondary">
                                Not Set
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Password Management */}
            {hasPassword !== null && <PasswordSettings hasPassword={hasPassword} />}
        </div>
    );
}
