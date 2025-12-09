'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { User } from '@/features/auth/domain/User';
import { Task } from '@/features/shells/domain/Task';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Calendar, Lock, Eye, EyeOff } from 'lucide-react';
import { TabNavigation } from './TabNavigation';
import { ProfileShellGrid } from './ProfileShellGrid';
import { FollowersList } from './FollowersList';
import { ProfileTab, ShellCard, UserProfile } from '../types';
import { useDailyTasks } from '../hooks/useDailyTasks';
import { useWeeklyTasks } from '../hooks/useWeeklyTasks';
import { useFollowers } from '../hooks/useFollowers';
import { useFollowing } from '../hooks/useFollowing';
import { useProfile } from '../hooks/useProfile';
import { CheckProfileAccessUseCase } from '@/features/settings/application/CheckProfileAccessUseCase';
import { privacyRepository } from '@/features/settings/infrastructure';
import { ViewableSections } from '@/features/settings/domain/PrivacySettings';
import { followRepository } from '@/features/social/infrastructure';
import { FollowUserUseCase } from '@/features/social/application/FollowUserUseCase';
import { UnfollowUserUseCase } from '@/features/social/application/UnfollowUserUseCase';

interface PublicProfileViewProps {
    user: User;
}

/**
 * Component to display a public user profile.
 * Shows avatar, username, bio, and public activity based on privacy settings.
 */
export function PublicProfileView({ user }: PublicProfileViewProps) {
    const [activeTab, setActiveTab] = useState<ProfileTab>('daily-shells');
    const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
    const [followedByMap, setFollowedByMap] = useState<Record<string, boolean>>({});
    const [viewableSections, setViewableSections] = useState<ViewableSections | null>(null);
    const [checkingAccess, setCheckingAccess] = useState(true);

    // Get current user to check access
    const { user: currentUser } = useProfile();

    // Memoize use cases
    const checkProfileAccess = useMemo(
        () => new CheckProfileAccessUseCase(privacyRepository),
        []
    );
    const followUserUseCase = useMemo(() => new FollowUserUseCase(followRepository), []);
    const unfollowUserUseCase = useMemo(() => new UnfollowUserUseCase(followRepository), []);

    // Fetch data for each tab
    const { tasks: dailyTasks, loading: dailyLoading } = useDailyTasks(user.id);
    const { tasks: weeklyTasks, loading: weeklyLoading } = useWeeklyTasks(user.id);
    const { followers, loading: followersLoading, refetch: refetchFollowers } = useFollowers(user.id);
    const { following, loading: followingLoading, refetch: refetchFollowing } = useFollowing(user.id);

    // Fetch current user's follow relationships
    useEffect(() => {
        async function fetchCurrentUserFollowData() {
            if (!currentUser?.id) return;

            try {
                // Get who the current user is following
                const currentUserFollowing = await followRepository.getFollowing(currentUser.id);
                const followingMapData: Record<string, boolean> = {};
                currentUserFollowing.forEach(id => {
                    followingMapData[id] = true;
                });
                setFollowingMap(followingMapData);

                // Get who is following the current user (to determine mutual/friends status)
                const currentUserFollowers = await followRepository.getFollowers(currentUser.id);
                const followedByMapData: Record<string, boolean> = {};
                currentUserFollowers.forEach(id => {
                    followedByMapData[id] = true;
                });
                setFollowedByMap(followedByMapData);
            } catch (error) {
                console.error('Error fetching current user follow data:', error);
            }
        }

        fetchCurrentUserFollowData();
    }, [currentUser?.id]);

    // Check what sections the current user can view
    useEffect(() => {
        async function checkAccess() {
            try {
                setCheckingAccess(true);
                const sections = await checkProfileAccess.getViewableSections(
                    currentUser?.id || null,
                    user.id
                );
                setViewableSections(sections);
            } catch (error) {
                console.error('Error checking profile access:', error);
                // Default to restrictive on error
                setViewableSections({
                    canViewProfile: false,
                    canViewSchedule: false,
                    canViewActivity: false,
                });
            } finally {
                setCheckingAccess(false);
            }
        }

        checkAccess();
    }, [currentUser?.id, user.id, checkProfileAccess]);

    // Helper function to map Task to ShellCard
    const mapTasksToShells = (tasks: Task[]): ShellCard[] => {
        const userProfile: UserProfile = {
            id: user.id,
            username: user.username,
            displayName: user.displayName || user.email.split('@')[0],
            email: user.email,
            avatar: user.photoURL,
            bio: user.bio,
            streakCount: 0,
            followers: 0,
            following: 0,
            createdAt: new Date(),
        };

        // Group tasks by date
        const tasksByDate = tasks.reduce((acc, task) => {
            const dateKey = task.date.toISOString().split('T')[0];
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(task);
            return acc;
        }, {} as Record<string, Task[]>);

        // Create a ShellCard for each date
        return Object.entries(tasksByDate).map(([dateKey, dateTasks]) => ({
            shell: {
                id: dateKey,
                userId: user.id,
                title: `Tasks for ${new Date(dateKey).toLocaleDateString()}`,
                date: dateKey,
                tasks: dateTasks.map(task => ({
                    id: task.id,
                    title: task.title,
                    time: task.startTime,
                    duration: task.duration,
                    category: (task.category || 'work') as any,
                    icon: '📝',
                    status: task.status === 'completed' ? 'done' : task.status === 'pending' ? 'in-progress' : 'missed',
                    description: task.description,
                })),
                visibility: 'public' as const,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            user: userProfile,
            likes: 0,
            isLiked: false,
            comments: 0,
        }));
    };

    // Helper function to map User to UserProfile
    const mapUserToUserProfile = (users: User[]): UserProfile[] => {
        return users.map(u => ({
            id: u.id,
            username: u.username,
            displayName: u.displayName || u.email.split('@')[0],
            email: u.email,
            avatar: u.photoURL,
            bio: u.bio,
            streakCount: 0,
            followers: 0,
            following: 0,
            createdAt: new Date(),
        }));
    };

    const dailyShells = useMemo(() => mapTasksToShells(dailyTasks), [dailyTasks]);
    const weeklyShells = useMemo(() => mapTasksToShells(weeklyTasks), [weeklyTasks]);
    const followerProfiles = useMemo(() => mapUserToUserProfile(followers), [followers]);
    const followingProfiles = useMemo(() => mapUserToUserProfile(following), [following]);

    const handleFollowClick = useCallback(async (targetUserId: string) => {
        if (!currentUser?.id) return;
        
        // Don't allow following yourself
        if (targetUserId === currentUser.id) return;

        const isCurrentlyFollowing = followingMap[targetUserId];

        try {
            if (isCurrentlyFollowing) {
                // Unfollow
                await unfollowUserUseCase.execute(currentUser.id, targetUserId);
                setFollowingMap((prev) => {
                    const newMap = { ...prev };
                    delete newMap[targetUserId];
                    return newMap;
                });
            } else {
                // Follow
                await followUserUseCase.execute(currentUser.id, targetUserId);
                setFollowingMap((prev) => ({
                    ...prev,
                    [targetUserId]: true,
                }));
            }
            // Refetch followers/following lists to update the UI
            refetchFollowers?.();
            refetchFollowing?.();
        } catch (error) {
            console.error('Error toggling follow:', error);
        }
    }, [currentUser?.id, followingMap, followUserUseCase, unfollowUserUseCase, refetchFollowers, refetchFollowing]);

    // Render private content message
    const renderPrivateMessage = (sectionName: string) => (
        <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">This content is private</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
                {user.displayName || user.username || 'This user'} has restricted who can view their {sectionName}.
            </p>
        </div>
    );

    // Render content based on privacy settings
    const renderContent = () => {
        // If we're still checking access
        if (checkingAccess || !viewableSections) {
            return (
                <div className="text-center py-8 text-muted-foreground">
                    <p>Loading...</p>
                </div>
            );
        }

        // Schedule tabs (daily-shells and weekly-shells)
        if (activeTab === 'daily-shells' || activeTab === 'weekly-shells') {
            if (!viewableSections.canViewSchedule) {
                return renderPrivateMessage('schedule');
            }

            if (activeTab === 'daily-shells') {
                return dailyLoading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading daily tasks...</div>
                ) : (
                    <ProfileShellGrid shells={dailyShells} />
                );
            }

            return weeklyLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading weekly tasks...</div>
            ) : (
                <ProfileShellGrid shells={weeklyShells} />
            );
        }

        // Activity tabs (followers and following)
        if (activeTab === 'followers' || activeTab === 'following') {
            if (!viewableSections.canViewActivity) {
                return renderPrivateMessage('activity');
            }

            if (activeTab === 'followers') {
                return followersLoading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading followers...</div>
                ) : (
                    <FollowersList 
                        users={followerProfiles} 
                        currentUserId={currentUser?.id}
                        onFollowClick={handleFollowClick} 
                        isFollowingMap={followingMap}
                        isFollowedByMap={followedByMap}
                    />
                );
            }

            return followingLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading following...</div>
            ) : (
                <FollowersList 
                    users={followingProfiles} 
                    currentUserId={currentUser?.id}
                    onFollowClick={handleFollowClick} 
                    isFollowingMap={followingMap}
                    isFollowedByMap={followedByMap}
                />
            );
        }

        return null;
    };

    // Determine if we should show profile details based on privacy
    const canViewProfileInfo = viewableSections?.canViewProfile ?? false;
    const isOwnProfile = currentUser?.id === user.id;
    const showProfileDetails = isOwnProfile || canViewProfileInfo || checkingAccess;

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={user.photoURL} alt={user.displayName || user.username} />
                            <AvatarFallback className="text-2xl">
                                {(user.displayName || user.username || user.email)?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                                <h1 className="text-3xl font-bold">
                                    {user.displayName || user.username}
                                </h1>
                                {user.username && (
                                    <span className="text-muted-foreground">@{user.username}</span>
                                )}
                            </div>

                            {showProfileDetails ? (
                                <>
                                    <p className="text-muted-foreground mb-4">
                                        {user.email}
                                    </p>

                                    {user.bio && (
                                        <p className="text-foreground mb-4">
                                            {user.bio}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                                    <EyeOff className="h-4 w-4" />
                                    <span className="text-sm">Profile details are private</span>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                        Joined {new Date().toLocaleDateString()}
                                    </span>
                                </div>
                                {!checkingAccess && viewableSections && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground text-xs">
                                            {[
                                                viewableSections.canViewProfile && 'Profile',
                                                viewableSections.canViewSchedule && 'Schedule',
                                                viewableSections.canViewActivity && 'Activity',
                                            ]
                                                .filter(Boolean)
                                                .join(', ') || 'Limited access'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tab Navigation */}
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Content */}
            <div className="max-w-4xl mx-auto">
                {renderContent()}
            </div>
        </div>
    );
}
