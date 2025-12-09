import { ChatRepository } from '../domain/ChatRepository';
import { ChatRoom } from '../domain/ChatRoom';
import { Message } from '../domain/Message';
import { User } from '@/features/auth/domain/User';
import { supabase } from '@/shared/config/supabase';
import { channelTracker } from '@/shared/config/supabaseChannels';

export class SupabaseChatRepository implements ChatRepository {
    private chatRoomsTable = 'chat_rooms';
    private messagesTable = 'messages';
    private usersTable = 'profiles';

    async createChatRoom(participants: string[]): Promise<string> {
        const { data, error } = await supabase.rpc('create_chat_room', {
            participant_ids: participants
        });

        if (error) throw error;
        return data;
    }

    async getChatRooms(userId: string): Promise<ChatRoom[]> {
        // Get all chat rooms where user is a participant
        const { data: userRooms, error: roomsError } = await supabase
            .from('chat_participants')
            .select('chat_room_id')
            .eq('user_id', userId);

        if (roomsError) throw roomsError;
        if (!userRooms || userRooms.length === 0) return [];

        const roomIds = userRooms.map(r => r.chat_room_id);

        // Get room details
        const { data: rooms, error } = await supabase
            .from(this.chatRoomsTable)
            .select('*')
            .in('id', roomIds)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('SupabaseChatRepository: Error fetching chat rooms', error);
            throw error;
        }

        // Get all participants for these rooms using RPC to bypass RLS recursion
        const { data: allParticipants, error: participantsError } = await supabase.rpc('get_chat_participants', {
            room_ids: roomIds
        });

        if (participantsError) throw participantsError;

        // Collect all unique user IDs to fetch profiles (excluding current user)
        const participantUserIds = new Set<string>();
        allParticipants?.forEach(p => {
            if (p.user_id !== userId) {
                participantUserIds.add(p.user_id);
            }
        });

        // Fetch all relevant profiles in one go
        const { data: profiles, error: profilesError } = await supabase
            .from(this.usersTable)
            .select('*')
            .in('id', Array.from(participantUserIds));

        if (profilesError) throw profilesError;

        // Create a map of user profiles for easy lookup
        const profilesMap = new Map<string, User>();
        profiles?.forEach(p => {
            profilesMap.set(p.id, {
                id: p.id,
                email: p.email,
                displayName: p.display_name,
                photoURL: p.photo_url,
                emailVerified: false,
                username: p.username,
                bio: p.bio,
            } as User);
        });

        const chatRooms: ChatRoom[] = [];

        for (const room of rooms) {
            // Get participants for this specific room
            const roomParticipantIds = allParticipants
                ?.filter(p => p.chat_room_id === room.id)
                .map(p => p.user_id) || [];

            // Map profiles
            const participantDetails: User[] = [];
            for (const pId of roomParticipantIds) {
                if (pId !== userId) {
                    const userProfile = profilesMap.get(pId);
                    if (userProfile) {
                        participantDetails.push(userProfile);
                    }
                }
            }

            chatRooms.push({
                id: room.id,
                participants: roomParticipantIds,
                lastMessage: room.last_message ? {
                    ...room.last_message,
                    createdAt: new Date(room.last_message.createdAt),
                } : undefined,
                createdAt: new Date(room.created_at),
                updatedAt: new Date(room.updated_at),
                participantDetails,
            });
        }

        return chatRooms;
    }

    async getChatRoom(chatRoomId: string): Promise<ChatRoom | null> {
        const { data, error } = await supabase
            .from(this.chatRoomsTable)
            .select('*')
            .eq('id', chatRoomId)
            .single();

        if (error || !data) return null;

        // Get participants
        const { data: roomParticipants } = await supabase
            .from('chat_participants')
            .select('user_id')
            .eq('chat_room_id', chatRoomId);

        const participantIds = roomParticipants?.map(p => p.user_id) || [];

        return {
            id: data.id,
            participants: participantIds,
            lastMessage: data.last_message ? {
                ...data.last_message,
                createdAt: new Date(data.last_message.createdAt),
            } : undefined,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
        };
    }

    async sendMessage(chatRoomId: string, senderId: string, content: string): Promise<void> {
        const timestamp = new Date().toISOString();

        const { error: messageError } = await supabase
            .from(this.messagesTable)
            .insert({
                chat_room_id: chatRoomId,
                sender_id: senderId,
                content,
                created_at: timestamp,
            });

        if (messageError) throw messageError;

        // Update chat room with last message
        const { error: updateError } = await supabase
            .from(this.chatRoomsTable)
            .update({
                last_message: { senderId, content, createdAt: timestamp, chatRoomId },
                updated_at: timestamp,
            })
            .eq('id', chatRoomId);

        if (updateError) throw updateError;
    }

    async getMessages(chatRoomId: string): Promise<Message[]> {
        const { data, error } = await supabase
            .from(this.messagesTable)
            .select('*')
            .eq('chat_room_id', chatRoomId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return data.map(msg => ({
            id: msg.id,
            senderId: msg.sender_id,
            content: msg.content,
            createdAt: new Date(msg.created_at),
            chatRoomId: msg.chat_room_id,
        }));
    }

    subscribeToMessages(chatRoomId: string, callback: (messages: Message[]) => void): () => void {
        // Maintain internal state for incremental updates
        let currentMessages: Message[] = [];
        let isInitialized = false;
        const channelName = `messages:${chatRoomId}`;

        // Helper to map database row to Message
        const mapRowToMessage = (row: any): Message => ({
            id: row.id,
            senderId: row.sender_id,
            content: row.content,
            createdAt: new Date(row.created_at),
            chatRoomId: row.chat_room_id,
        });

        // Initial fetch to populate state
        this.getMessages(chatRoomId).then(messages => {
            currentMessages = messages;
            isInitialized = true;
            // Don't call callback here - component does its own initial fetch
        }).catch(err => {
            console.error('Failed to initialize message subscription state:', err);
        });

        const channel = supabase
            .channel(channelName)
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: this.messagesTable, filter: `chat_room_id=eq.${chatRoomId}` },
                (payload) => {
                    if (!isInitialized) {
                        // If not initialized yet, do a full fetch
                        this.getMessages(chatRoomId).then(messages => {
                            currentMessages = messages;
                            isInitialized = true;
                            callback(currentMessages);
                        });
                        return;
                    }
                    // Append new message
                    const newMessage = mapRowToMessage(payload.new);
                    // Avoid duplicates by checking if message already exists
                    if (!currentMessages.some(m => m.id === newMessage.id)) {
                        currentMessages = [...currentMessages, newMessage];
                        callback(currentMessages);
                    }
                }
            )
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: this.messagesTable, filter: `chat_room_id=eq.${chatRoomId}` },
                (payload) => {
                    if (!isInitialized) return;
                    // Update existing message
                    const updatedMessage = mapRowToMessage(payload.new);
                    currentMessages = currentMessages.map(m => 
                        m.id === updatedMessage.id ? updatedMessage : m
                    );
                    callback(currentMessages);
                }
            )
            .on('postgres_changes',
                { event: 'DELETE', schema: 'public', table: this.messagesTable, filter: `chat_room_id=eq.${chatRoomId}` },
                (payload) => {
                    if (!isInitialized) return;
                    // Remove deleted message
                    const deletedId = (payload.old as any).id;
                    currentMessages = currentMessages.filter(m => m.id !== deletedId);
                    callback(currentMessages);
                }
            )
            .subscribe();

        // Track channel for debugging
        channelTracker.track(channelName, channel, 'ChatWindow');

        return () => {
            channelTracker.untrack(channelName);
            supabase.removeChannel(channel);
        };
    }

    subscribeToChatRooms(userId: string, callback: (rooms: ChatRoom[]) => void): () => void {
        const channelName = `chat_rooms:${userId}`;
        
        // Subscribe to chat_rooms table changes for rooms the user participates in
        const channel = supabase
            .channel(channelName)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: this.chatRoomsTable },
                async () => {
                    // Refetch all chat rooms when there's a change (e.g., new message updates last_message)
                    try {
                        const rooms = await this.getChatRooms(userId);
                        callback(rooms);
                    } catch (error) {
                        console.error('Error fetching chat rooms on realtime update:', error);
                    }
                }
            )
            .subscribe();

        // Track channel for debugging
        channelTracker.track(channelName, channel, 'ChatRoomList');

        return () => {
            channelTracker.untrack(channelName);
            supabase.removeChannel(channel);
        };
    }

    async getAllUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from(this.usersTable)
            .select('*');

        if (error) {
            console.error('SupabaseChatRepository: Error fetching all users', error);
            throw error;
        }

        return data.map(user => ({
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            photoURL: user.photo_url,
            emailVerified: false,
            username: user.username,
        } as User));
    }
}
