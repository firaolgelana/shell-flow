import { ChatRoom } from './ChatRoom';
import { Message } from './Message';
import { User } from '@/features/auth/domain/User';

export interface ChatRepository {
    createChatRoom(participants: string[]): Promise<string>;
    getChatRooms(userId: string): Promise<ChatRoom[]>;
    getChatRoom(chatRoomId: string): Promise<ChatRoom | null>;
    sendMessage(chatRoomId: string, senderId: string, content: string): Promise<void>;
    getMessages(chatRoomId: string): Promise<Message[]>;
    subscribeToMessages(chatRoomId: string, callback: (messages: Message[]) => void): () => void;
    subscribeToChatRooms(userId: string, callback: (rooms: ChatRoom[]) => void): () => void;
    getAllUsers(): Promise<User[]>;
}
