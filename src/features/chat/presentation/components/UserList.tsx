import React, { useEffect, useState } from 'react';
import { User } from '@/features/auth/domain/User';
import { GetAllUsers } from '@/features/chat/application/GetAllUsers';
import { CreateChatRoom } from '@/features/chat/application/CreateChatRoom';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useAuth } from '@/features/auth/presentation/useAuth';
import { chatRepository } from '@/features/chat/infrastructure';
import { followRepository } from '@/features/social/infrastructure';

interface UserListProps {
    onChatCreated: (chatRoomId: string) => void;
}

export const UserList: React.FC<UserListProps> = ({ onChatCreated }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const { user: currentUser } = useAuth();

    // Dependency injection
    const getAllUsers = new GetAllUsers(chatRepository);
    const createChatRoom = new CreateChatRoom(chatRepository);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                if (!currentUser) return;

                // Get followers of the current user
                const followerIds = await followRepository.getFollowers(currentUser.id);

                // Fetch all users
                const fetchedUsers = await getAllUsers.execute();

                // Filter to show only followers
                const uniqueUsers = Array.from(new Map(fetchedUsers.map(user => [user.email, user])).values());
                const followerUsers = uniqueUsers.filter(u =>
                    u.id !== currentUser.id && followerIds.includes(u.id)
                );

                setUsers(followerUsers);
            } catch (error) {
                console.error("Failed to fetch users", error);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            fetchUsers();
        }
    }, [currentUser]);

    const handleUserClick = async (otherUserId: string) => {
        if (!currentUser) return;
        try {
            const chatRoomId = await createChatRoom.execute([currentUser.id, otherUserId]);
            onChatCreated(chatRoomId);
        } catch (error) {
            console.error("Failed to create chat room", error);
        }
    };

    return (
        <Card className="h-full flex flex-col gap-0 py-0">
            <CardHeader className="flex-shrink-0 border-b py-4">
                <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0 min-h-0">
                {loading ? (
                    <div className="p-4 text-center">Loading users...</div>
                ) : (
                    <div className="flex flex-col gap-2 p-4">
                        {users.map(user => (
                            <Button
                                key={user.id}
                                variant="ghost"
                                className="justify-start h-auto py-3 px-4"
                                onClick={() => handleUserClick(user.id)}
                            >
                                <Avatar className="h-10 w-10 mr-3">
                                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                                    <AvatarFallback>{user.displayName?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">{user.displayName || user.email}</span>
                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                </div>
                            </Button>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
