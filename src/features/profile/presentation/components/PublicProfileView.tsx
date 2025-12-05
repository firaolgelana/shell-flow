'use client';

import React, { useState, useMemo } from 'react';
import { User } from '@/features/auth/domain/User';
import { Task } from '@/features/shells/domain/Task';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Calendar } from 'lucide-react';
import { TabNavigation } from './TabNavigation';
import { ProfileShellGrid } from './ProfileShellGrid';
import { FollowersList } from './FollowersList';
import { ProfileTab, ShellCard, UserProfile } from '../types';
import { useDailyTasks } from '../hooks/useDailyTasks';
import { useWeeklyTasks } from '../hooks/useWeeklyTasks';
import { useFollowers } from '../hooks/useFollowers';
import { useFollowing } from '../hooks/useFollowing';
import { useProfile } from '../hooks/useProfile';
import { followRepository } from '@/features/social/infrastructure';

interface PublicProfileViewProps {
    user: User;
}

/**
 * Component to display a public user profile.
 * Shows avatar, username, bio, and public activity.
 */
export function PublicProfileView({ user }: PublicProfileViewProps) {
    const [activeTab, setActiveTab] = useState<ProfileTab>('daily-shells');
    const [isFollower, setIsFollower] = useState<boolean | null>(null);
    const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

    // Get current user to check if they're a follower
    const { user: currentUser } = useProfile();

    // Fetch data for each tab
    const { tasks: dailyTasks, loading: dailyLoading } = useDailyTasks(user.id);
    const { tasks: weeklyTasks, loading: weeklyLoading } = useWeeklyTasks(user.id);
    const { followers, loading: followersLoading } = useFollowers(user.id);
    const { following, loading: followingLoading } = useFollowing(user.id);

    // Check if current user is a follower
    React.useEffect(() => {
        if (currentUser?.id && user.id) {
            followRepository.isFollowing(currentUser.id, user.id)
                .then(setIsFollower)
                .catch(err => {
                    console.error('Error checking follow status:', err);
                    setIsFollower(false);
                });
        }
    }, [currentUser?.id, user.id]);

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

    const handleFollowClick = (userId: string) => {
        setFollowingMap((prev) => ({
            ...prev,
            [userId]: !prev[userId],
        }));
    };

    // Render content based on follower status
    const renderContent = () => {
        // If we're still checking follower status
        if (isFollower === null) {
            return (
                <div className="text-center py-8 text-muted-foreground">
                    <p>Loading...</p>
                </div>
            );
        }

        // If user is not a follower, show privacy message
        if (!isFollower && currentUser?.id !== user.id) {
            return (
                <div className="text-center py-8 text-muted-foreground">
                    <p>This content is only visible to followers.</p>
                    <p className="text-sm mt-2">Follow this user to see their shells and activity.</p>
                </div>
            );
        }

        // User is a follower or viewing their own profile, show content
        return (
            <>
                {activeTab === 'daily-shells' && (
                    dailyLoading ? (
                        <div className="text-center py-12 text-gray-600">Loading daily tasks...</div>
                    ) : (
                        <ProfileShellGrid shells={dailyShells} />
                    )
                )}
                {activeTab === 'weekly-shells' && (
                    weeklyLoading ? (
                        <div className="text-center py-12 text-gray-600">Loading weekly tasks...</div>
                    ) : (
                        <ProfileShellGrid shells={weeklyShells} />
                    )
                )}
                {activeTab === 'followers' && (
                    followersLoading ? (
                        <div className="text-center py-12 text-gray-600">Loading followers...</div>
                    ) : (
                        <FollowersList users={followerProfiles} onFollowClick={handleFollowClick} isFollowingMap={followingMap} />
                    )
                )}
                {activeTab === 'following' && (
                    followingLoading ? (
                        <div className="text-center py-12 text-gray-600">Loading following...</div>
                    ) : (
                        <FollowersList users={followingProfiles} onFollowClick={handleFollowClick} isFollowingMap={followingMap} />
                    )
                )}
            </>
        );
    };

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

                            <p className="text-muted-foreground mb-4">
                                {user.email}
                            </p>

                            {user.bio && (
                                <p className="text-foreground mb-4">
                                    {user.bio}
                                </p>
                            )}

                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                        Joined {new Date().toLocaleDateString()}
                                    </span>
                                </div>
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
