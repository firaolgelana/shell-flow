'use client';

import React, { useState } from 'react';
import { usePasswordManagement } from '../hooks/usePasswordManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

interface PasswordSettingsProps {
    hasPassword: boolean;
}

export function PasswordSettings({ hasPassword }: PasswordSettingsProps) {
    const { loading, error, linkPassword, updatePassword } = usePasswordManagement();
    const [showPassword, setShowPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [success, setSuccess] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const validatePassword = (pwd: string): string | null => {
        if (pwd.length < 8) {
            return 'Password must be at least 8 characters long';
        }
        if (!/[A-Z]/.test(pwd)) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!/[a-z]/.test(pwd)) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!/[0-9]/.test(pwd)) {
            return 'Password must contain at least one number';
        }
        return null;
    };

    const getPasswordStrength = (pwd: string): { strength: string; color: string } => {
        let strength = 0;
        if (pwd.length >= 8) strength++;
        if (pwd.length >= 12) strength++;
        if (/[A-Z]/.test(pwd)) strength++;
        if (/[a-z]/.test(pwd)) strength++;
        if (/[0-9]/.test(pwd)) strength++;
        if (/[^A-Za-z0-9]/.test(pwd)) strength++;

        if (strength <= 2) return { strength: 'Weak', color: 'text-red-500' };
        if (strength <= 4) return { strength: 'Medium', color: 'text-yellow-500' };
        return { strength: 'Strong', color: 'text-green-500' };
    };

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccess(false);
        setValidationError(null);

        const validation = validatePassword(password);
        if (validation) {
            setValidationError(validation);
            return;
        }

        if (password !== confirmPassword) {
            setValidationError('Passwords do not match');
            return;
        }

        const result = await linkPassword(password);
        if (result.success) {
            setSuccess(true);
            setPassword('');
            setConfirmPassword('');
            setTimeout(() => setSuccess(false), 5000);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccess(false);
        setValidationError(null);

        const validation = validatePassword(newPassword);
        if (validation) {
            setValidationError(validation);
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setValidationError('Passwords do not match');
            return;
        }

        const result = await updatePassword(currentPassword, newPassword);
        if (result.success) {
            setSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setTimeout(() => setSuccess(false), 5000);
        }
    };

    const passwordStrength = hasPassword ? getPasswordStrength(newPassword) : getPasswordStrength(password);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    {hasPassword ? 'Change Password' : 'Set Password'}
                </CardTitle>
                <CardDescription>
                    {hasPassword
                        ? 'Update your password to keep your account secure'
                        : 'Set a password to enable email/password sign-in'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {success && (
                    <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-600">
                            Password {hasPassword ? 'updated' : 'set'} successfully!
                        </AlertDescription>
                    </Alert>
                )}

                {(error || validationError) && (
                    <Alert className="mb-4 border-red-500 bg-red-50 dark:bg-red-950">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-600">
                            {validationError || error}
                        </AlertDescription>
                    </Alert>
                )}

                {!hasPassword ? (
                    <form onSubmit={handleSetPassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            {password && (
                                <p className={`text-sm ${passwordStrength.color}`}>
                                    Strength: {passwordStrength.strength}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                                required
                            />
                        </div>

                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Setting Password...' : 'Set Password'}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <div className="relative">
                                <Input
                                    id="currentPassword"
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            {newPassword && (
                                <p className={`text-sm ${passwordStrength.color}`}>
                                    Strength: {passwordStrength.strength}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                            <Input
                                id="confirmNewPassword"
                                type="password"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                            />
                        </div>

                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Updating Password...' : 'Update Password'}
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}
