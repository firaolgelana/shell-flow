import { ChatRepository } from '../domain/ChatRepository';
import { ChatRoom } from '../domain/ChatRoom';
import { Message } from '../domain/Message';
import { User } from '@/features/auth/domain/User';
import { supabase } from '@/shared/config/supabase';

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

        if (error) throw error;

        const chatRooms: ChatRoom[] = [];

        for (const room of rooms) {
            // Get all participants for this room
            const { data: roomParticipants } = await supabase
                .from('chat_participants')
                .select('user_id')
                .eq('chat_room_id', room.id);

            const participantIds = roomParticipants?.map(p => p.user_id) || [];

            // Fetch participant details (excluding current user)
            const participantDetails: User[] = [];
            for (const pId of participantIds) {
                if (pId !== userId) {
                    const { data: userData } = await supabase
                        .from(this.usersTable)
                        .select('*')
                        .eq('id', pId)
                        .single();

                    if (userData) {
                        participantDetails.push({
                            id: userData.id,
                            email: userData.email,
                            displayName: userData.display_name,
                            photoURL: userData.photo_url,
                            emailVerified: false,
                            username: userData.username,
                            bio: userData.bio,
                        } as User);
                    }
                }
            }

            chatRooms.push({
                id: room.id,
                participants: participantIds,
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
        const channel = supabase
            .channel(`messages:${chatRoomId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: this.messagesTable, filter: `chat_room_id=eq.${chatRoomId}` },
                async () => {
                    // Refetch all messages when there's a change
                    const messages = await this.getMessages(chatRoomId);
                    callback(messages);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }

    async getAllUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from(this.usersTable)
            .select('*');

        if (error) throw error;

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
