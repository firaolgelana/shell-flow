'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { User } from '@/features/auth/domain/User';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Search, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { ManageCustomVisibilityUseCase } from '../../application/ManageCustomVisibilityUseCase';
import { privacyRepository } from '../../infrastructure';
import { ProfileSection } from '../../domain/PrivacySettings';
import { userRepository } from '@/features/profile/infrastructure';

interface CustomVisibilityDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    section: ProfileSection;
    ownerId: string;
}

const SECTION_LABELS: Record<ProfileSection, string> = {
    profile: 'Profile Info',
    schedule: 'Schedule',
    activity: 'Activity',
};

export function CustomVisibilityDialog({
    open,
    onOpenChange,
    section,
    ownerId,
}: CustomVisibilityDialogProps) {
    const [allowedUsers, setAllowedUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Memoize use case
    const manageCustomVisibility = useMemo(
        () => new ManageCustomVisibilityUseCase(privacyRepository),
        []
    );

    // Fetch allowed users when dialog opens
    useEffect(() => {
        async function fetchAllowedUsers() {
            if (!open) return;

            try {
                setLoading(true);
                const users = await manageCustomVisibility.getAllowedUsers(ownerId, section);
                setAllowedUsers(users);
            } catch (error) {
                console.error('Failed to fetch allowed users:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchAllowedUsers();
    }, [open, ownerId, section, manageCustomVisibility]);

    // Search for users
    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            setSearching(true);
            const results = await userRepository.searchUsers(searchQuery);
            // Filter out the owner and already allowed users
            const filteredResults = results.filter(
                (u) => u.id !== ownerId && !allowedUsers.some((au) => au.id === u.id)
            );
            setSearchResults(filteredResults);
        } catch (error) {
            console.error('Failed to search users:', error);
        } finally {
            setSearching(false);
        }
    }, [searchQuery, ownerId, allowedUsers]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(handleSearch, 300);
        return () => clearTimeout(timer);
    }, [handleSearch]);

    const handleAddUser = async (user: User) => {
        try {
            setActionLoading(user.id);
            await manageCustomVisibility.addUser(ownerId, user.id, section);
            setAllowedUsers((prev) => [...prev, user]);
            setSearchResults((prev) => prev.filter((u) => u.id !== user.id));
        } catch (error) {
            console.error('Failed to add user:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemoveUser = async (userId: string) => {
        try {
            setActionLoading(userId);
            await manageCustomVisibility.removeUser(ownerId, userId, section);
            setAllowedUsers((prev) => prev.filter((u) => u.id !== userId));
        } catch (error) {
            console.error('Failed to remove user:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const renderUserItem = (user: User, isAllowed: boolean) => (
        <div
            key={user.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50"
        >
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={user.photoURL} alt={user.displayName || user.username} />
                    <AvatarFallback>
                        {(user.displayName || user.username || user.email)?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-medium">
                        {user.displayName || user.username || 'Unknown'}
                    </p>
                    {user.username && (
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                    )}
                </div>
            </div>
            <Button
                variant={isAllowed ? 'destructive' : 'secondary'}
                size="sm"
                onClick={() => (isAllowed ? handleRemoveUser(user.id) : handleAddUser(user))}
                disabled={actionLoading === user.id}
            >
                {actionLoading === user.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : isAllowed ? (
                    <>
                        <UserMinus className="h-4 w-4 mr-1" />
                        Remove
                    </>
                ) : (
                    <>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add
                    </>
                )}
            </Button>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Manage Custom Access - {SECTION_LABELS[section]}</DialogTitle>
                    <DialogDescription>
                        Choose who can see your {SECTION_LABELS[section].toLowerCase()}. Only users in this
                        list will have access.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users to add..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Search results */}
                    {searchQuery && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground">
                                Search Results
                            </h4>
                            {searching ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="space-y-1">
                                    {searchResults.slice(0, 5).map((user) => renderUserItem(user, false))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No users found
                                </p>
                            )}
                        </div>
                    )}

                    {/* Allowed users list */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">
                            Allowed Users ({allowedUsers.length})
                        </h4>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : allowedUsers.length > 0 ? (
                            <ScrollArea className="h-[200px]">
                                <div className="space-y-1">
                                    {allowedUsers.map((user) => renderUserItem(user, true))}
                                </div>
                            </ScrollArea>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No users added yet</p>
                                <p className="text-sm">Search for users to give them access</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

