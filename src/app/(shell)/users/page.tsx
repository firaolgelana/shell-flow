'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Search } from 'lucide-react';
import { UserCard } from '@/features/social/presentation/components/UserCard';
import { User } from '@/features/auth/domain/User';
import { useAuth } from '@/features/auth/presentation/useAuth';
import { chatRepository } from '@/features/chat/infrastructure';

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const fetchedUsers = await chatRepository.getAllUsers();

                // Filter out the current user
                const filteredUsers = fetchedUsers.filter(user => user.id !== currentUser?.id);
                setUsers(filteredUsers);
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            fetchUsers();
        }
    }, [currentUser]);

    const filteredUsers = users.filter(user => {
        const query = searchQuery.toLowerCase();
        return (
            user.displayName?.toLowerCase().includes(query) ||
            user.username?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Discover Users</h1>
                <p className="text-muted-foreground">Find and connect with other users</p>
            </div>

            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, username, or email..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Loading users...</p>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        {searchQuery ? 'No users found matching your search' : 'No users found'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredUsers.map(user => (
                        <UserCard key={user.id} user={user} />
                    ))}
                </div>
            )}
        </div>
    );
}
