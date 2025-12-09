import { ChatRepository } from '../domain/ChatRepository';
import { ChatRoom } from '../domain/ChatRoom';

export class GetChatRooms {
    constructor(private chatRepository: ChatRepository) { }

    async execute(userId: string): Promise<ChatRoom[]> {
        return this.chatRepository.getChatRooms(userId);
    }

    subscribe(userId: string, callback: (rooms: ChatRoom[]) => void): () => void {
        return this.chatRepository.subscribeToChatRooms(userId, callback);
    }
}
