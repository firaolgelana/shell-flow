import React from 'react';
import { UserProfile } from '../types';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import Link from 'next/link';
import { Users } from 'lucide-react';

interface FollowersListProps {
    users: UserProfile[];
    currentUserId?: string;
    onFollowClick?: (userId: string) => void;
    /** Map of user IDs that the current user is following */
    isFollowingMap?: Record<string, boolean>;
    /** Map of user IDs that are following the current user back */
    isFollowedByMap?: Record<string, boolean>;
}

export const FollowersList: React.FC<FollowersListProps> = ({
    users,
    currentUserId,
    onFollowClick,
    isFollowingMap = {},
    isFollowedByMap = {},
}) => {
    if (users.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">No users to display</p>
            </div>
        );
    }

    const getFollowStatus = (userId: string) => {
        const isFollowing = isFollowingMap[userId];
        const isFollowedBy = isFollowedByMap[userId];
        
        if (isFollowing && isFollowedBy) {
            return 'friends';
        } else if (isFollowing) {
            return 'following';
        } else {
            return 'none';
        }
    };

    const renderFollowButton = (userId: string) => {
        // Don't show follow button for yourself
        if (userId === currentUserId) {
            return (
                <Badge variant="outline" className="text-muted-foreground">
                    You
                </Badge>
            );
        }

        const status = getFollowStatus(userId);

        switch (status) {
            case 'friends':
                return (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onFollowClick?.(userId)}
                        className="gap-1"
                    >
                        <Users className="h-3 w-3" />
                        Friends
                    </Button>
                );
            case 'following':
                return (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onFollowClick?.(userId)}
                    >
                        Following
                    </Button>
                );
            default:
                return (
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => onFollowClick?.(userId)}
                    >
                        Follow
                    </Button>
                );
        }
    };

    return (
        <div className="space-y-4">
            {users.map((user) => (
                <div
                    key={user.id}
                    className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                            <AvatarImage src={user.avatar} alt={user.displayName || user.username} />
                            <AvatarFallback>
                                {(user.displayName || user.username || '?').charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            {user.username ? (
                                <Link href={`/${user.username}`}>
                                    <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                                        {user.displayName || user.username}
                                    </h3>
                                </Link>
                            ) : (
                                <h3 className="font-semibold text-foreground">
                                    {user.displayName || 'Unknown User'}
                                </h3>
                            )}
                            {user.username && (
                                <p className="text-xs text-muted-foreground">@{user.username}</p>
                            )}
                        </div>
                    </div>
                    {renderFollowButton(user.id)}
                </div>
            ))}
        </div>
    );
};
