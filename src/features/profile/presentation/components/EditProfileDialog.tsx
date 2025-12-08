'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Button } from '@/shared/components/ui/button';
import { Loader2, Check, X, AtSign } from 'lucide-react';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import { useUpdateUsername } from '../hooks/useUpdateUsername';
import { toast } from 'sonner';

interface EditProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    currentBio?: string;
    currentDisplayName?: string;
    currentUsername?: string;
    onSuccess?: () => void;
}

export function EditProfileDialog({
    open,
    onOpenChange,
    userId,
    currentBio = '',
    currentDisplayName = '',
    currentUsername = '',
    onSuccess,
}: EditProfileDialogProps) {
    const { updateProfile, loading: profileLoading } = useUpdateProfile();
    const { updateUsername, validateFormat, checkAvailability, loading: usernameLoading } = useUpdateUsername();

    const [bio, setBio] = useState(currentBio || '');
    const [displayName, setDisplayName] = useState(currentDisplayName || '');
    const [username, setUsername] = useState(currentUsername || '');
    const [usernameValidation, setUsernameValidation] = useState<{
        isValid: boolean;
        error?: string;
    } | null>(null);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [checkingAvailability, setCheckingAvailability] = useState(false);

    // Update local state when props change
    useEffect(() => {
        setBio(currentBio || '');
        setDisplayName(currentDisplayName || '');
        setUsername(currentUsername || '');
    }, [currentBio, currentDisplayName, currentUsername, open]);

    // Validate username format and check availability
    useEffect(() => {
        if (!username) {
            setUsernameValidation(null);
            setIsAvailable(null);
            return;
        }

        const validation = validateFormat(username);
        setUsernameValidation(validation);

        // Only check availability if format is valid and different from current
        if (validation.isValid && username.toLowerCase() !== currentUsername?.toLowerCase()) {
            setCheckingAvailability(true);
            const debounce = setTimeout(async () => {
                const available = await checkAvailability(username);
                setIsAvailable(available);
                setCheckingAvailability(false);
            }, 500);

            return () => clearTimeout(debounce);
        } else if (username.toLowerCase() === currentUsername?.toLowerCase()) {
            setIsAvailable(true); // Current username is "available" for user
        } else {
            setIsAvailable(null);
        }
    }, [username, currentUsername, validateFormat, checkAvailability]);

    const handleSave = async () => {
        const loading = profileLoading || usernameLoading;

        // Update username if changed
        if (username.trim() && username.toLowerCase() !== currentUsername?.toLowerCase()) {
            if (!usernameValidation?.isValid || !isAvailable) {
                toast.error('Please fix username errors before saving');
                return;
            }

            const usernameSuccess = await updateUsername(userId, username.trim());
            if (!usernameSuccess) {
                toast.error('Failed to update username');
                return;
            }
        }

        // Update profile (bio, displayName)
        const success = await updateProfile(userId, {
            bio: bio.trim(),
            displayName: displayName.trim(),
        });

        if (success) {
            toast.success('Profile updated successfully!');
            onOpenChange(false);
            onSuccess?.();
        } else {
            toast.error('Failed to update profile');
        }
    };

    const hasChanges =
        bio.trim() !== currentBio ||
        displayName.trim() !== currentDisplayName ||
        (username.trim() && username.toLowerCase() !== currentUsername?.toLowerCase());

    const canSave =
        hasChanges &&
        !profileLoading &&
        !usernameLoading &&
        (!username.trim() || (usernameValidation?.isValid && isAvailable));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Update your profile information. Changes will be visible on your public profile.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Username */}
                    <div className="space-y-2">
                        <Label htmlFor="username" className="flex items-center gap-2">
                            <AtSign className="h-4 w-4" />
                            Username
                        </Label>
                        <div className="relative">
                            <Input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                className={
                                    usernameValidation && !usernameValidation.isValid
                                        ? 'border-destructive'
                                        : usernameValidation?.isValid && isAvailable
                                            ? 'border-green-500'
                                            : ''
                                }
                            />
                            {checkingAvailability && (
                                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                            {!checkingAvailability && usernameValidation?.isValid && isAvailable !== null && (
                                <div className="absolute right-3 top-3">
                                    {isAvailable ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <X className="h-4 w-4 text-destructive" />
                                    )}
                                </div>
                            )}
                        </div>
                        {usernameValidation && !usernameValidation.isValid && (
                            <p className="text-xs text-destructive">{usernameValidation.error}</p>
                        )}
                        {usernameValidation?.isValid && isAvailable === false && (
                            <p className="text-xs text-destructive">Username is already taken</p>
                        )}
                        {usernameValidation?.isValid && isAvailable === true && username !== currentUsername && (
                            <p className="text-xs text-green-600">Username is available!</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Your public profile will be accessible at /{username || 'username'}
                        </p>
                    </div>

                    {/* Display Name */}
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your display name"
                            maxLength={100}
                        />
                        <p className="text-xs text-muted-foreground">
                            {displayName.length}/100 characters
                        </p>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                            rows={4}
                            maxLength={500}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            {bio.length}/500 characters
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={profileLoading || usernameLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!canSave}
                    >
                        {(profileLoading || usernameLoading) ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
