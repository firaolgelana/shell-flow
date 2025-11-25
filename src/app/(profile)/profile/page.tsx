'use client';

import React, { useState, useMemo } from 'react';
import { useProfile } from '@/features/profile/presentation/hooks/useProfile';
import { DashboardLayout } from '@/features/profile/presentation/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import { ProfileHeader } from '@/features/profile/presentation/components/ProfileHeader';
import { TabNavigation } from '@/features/profile/presentation/components/TabNavigation';
import { ProfileShellGrid } from '@/features/profile/presentation/components/ProfileShellGrid';
import { FollowersList } from '@/features/profile/presentation/components/FollowersList';
import { ProfileTab, UserProfile, ShellCard } from '@/features/profile/presentation/types';

export default function ProfilePage() {
    const { user, loading: profileLoading, error: profileError } = useProfile();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<ProfileTab>('daily-shells');
    const [isFollowing, setIsFollowing] = useState(false);
    const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

    // Redirect to sign-in if not authenticated
    if (!profileLoading && !user) {
        router.push('/sign-in');
        return null;
    }

    // Map domain user to presentation user profile
    const userProfile: UserProfile | null = useMemo(() => {
        if (!user) return null;
        return {
            id: user.id,
            username: user.displayName || user.email.split('@')[0],
            email: user.email,
            avatar: user.photoURL || undefined,
            bio: 'Productivity enthusiast • Full-stack developer', // Mock data
            streakCount: 45, // Mock data
            followers: 1234, // Mock data
            following: 456, // Mock data
            createdAt: new Date(), // Mock data
        };
    }, [user]);

    // Map domain tasks to presentation tasks and shells
    const shells: ShellCard[] = useMemo(() => {
        if (!userProfile) return [];

        // Return empty shells for now as task management is moved
        return [];
    }, [userProfile]);

    const handleFollowClick = (userId: string) => {
        setFollowingMap((prev) => ({
            ...prev,
            [userId]: !prev[userId],
        }));
    };

    // Show error state
    if (profileError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-red-500 text-xl">{profileError}</div>
            </div>
        );
    }

    if (profileLoading || !userProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex-1 min-h-screen bg-background pb-20 md:pb-0 overflow-y-auto">
                <ProfileHeader
                    user={userProfile}
                    isOwnProfile={true}
                    onFollowClick={() => setIsFollowing(!isFollowing)}
                    isFollowing={isFollowing}
                />

                <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

                {/* Content */}
                <div className="max-w-4xl mx-auto px-4 py-8">
                    {activeTab === 'daily-shells' && <ProfileShellGrid shells={shells} />}
                    {activeTab === 'weekly-shells' && (
                        <div className="text-center py-12 text-gray-600">No weekly shells yet</div>
                    )}
                    {activeTab === 'followers' && (
                        <FollowersList users={[]} onFollowClick={handleFollowClick} isFollowingMap={followingMap} />
                    )}
                    {activeTab === 'following' && (
                        <FollowersList users={[]} onFollowClick={handleFollowClick} isFollowingMap={followingMap} />
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
