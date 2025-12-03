import { ChatRepository } from '../domain/ChatRepository';
import { ChatRoom } from '../domain/ChatRoom';
import { Message } from '../domain/Message';
import { User } from '@/features/auth/domain/User';
import { db } from '@/features/auth/infrastructure/firebase/firebaseConfig';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    Timestamp,
    orderBy,
    onSnapshot,
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    serverTimestamp,
    FieldValue
} from 'firebase/firestore';

export class FirebaseChatRepository implements ChatRepository {
    private chatRoomsCollection = 'chatRooms';
    private messagesCollection = 'messages';
    private usersCollection = 'users';

    async createChatRoom(participants: string[]): Promise<string> {
        // Check if a chat room with these exact participants already exists
        // This is a bit complex in Firestore without a specific structure, 
        // but for now we'll just create a new one or return existing if we can find it easily.
        // A better approach for 1-on-1 chats is to generate a deterministic ID (e.g., sorted userIds joined)

        const sortedParticipants = [...participants].sort();
        // For 1-on-1, we can try to find if one exists
        if (sortedParticipants.length === 2) {
            // This query is limited in Firestore (array-contains can only check one value usually or requires specific index)
            // A common pattern is to store a "participantIds" array and query it.
            // Or construct a unique ID for 1-on-1: `chat_${uid1}_${uid2}`
        }

        const chatRoomRef = await addDoc(collection(db, this.chatRoomsCollection), {
            participants: participants,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return chatRoomRef.id;
    }

    async getChatRooms(userId: string): Promise<ChatRoom[]> {
        let snapshot;
        try {
            const q = query(
                collection(db, this.chatRoomsCollection),
                where('participants', 'array-contains', userId),
                orderBy('updatedAt', 'desc')
            );
            snapshot = await getDocs(q);
        } catch (error: any) {
            if (error.code === 'failed-precondition' || error.message?.includes('index')) {
                console.warn('Firestore index missing. Falling back to client-side sorting.');
                console.warn(error.message);
                const q = query(
                    collection(db, this.chatRoomsCollection),
                    where('participants', 'array-contains', userId)
                );
                snapshot = await getDocs(q);
            } else {
                throw error;
            }
        }

        const chatRooms: ChatRoom[] = [];

        for (const docSnapshot of snapshot.docs) {
            const data = docSnapshot.data();
            const participants = data.participants as string[];

            // Fetch participant details
            const participantDetails: User[] = [];
            for (const pId of participants) {
                if (pId !== userId) { // Optionally exclude self, or include all
                    const userDoc = await getDoc(doc(db, this.usersCollection, pId));
                    if (userDoc.exists()) {
                        // Map Firestore user data to User interface
                        const userData = userDoc.data();
                        participantDetails.push({
                            id: userDoc.id,
                            email: userData.email,
                            displayName: userData.displayName,
                            photoURL: userData.photoURL,
                            emailVerified: userData.emailVerified,
                            username: userData.username
                        } as User);
                    }
                }
            }

            chatRooms.push({
                id: docSnapshot.id,
                participants: data.participants,
                lastMessage: data.lastMessage ? {
                    ...data.lastMessage,
                    createdAt: data.lastMessage.createdAt ? (data.lastMessage.createdAt as Timestamp).toDate() : new Date()
                } : undefined,
                createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
                updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date(),
                participantDetails
            });
        }

        // Ensure sorting if we fell back
        return chatRooms.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }

    async getChatRoom(chatRoomId: string): Promise<ChatRoom | null> {
        const docRef = doc(db, this.chatRoomsCollection, chatRoomId);
        const docSnapshot = await getDoc(docRef);
        if (!docSnapshot.exists()) return null;

        const data = docSnapshot.data();
        return {
            id: docSnapshot.id,
            participants: data.participants,
            lastMessage: data.lastMessage ? {
                ...data.lastMessage,
                createdAt: data.lastMessage.createdAt ? (data.lastMessage.createdAt as Timestamp).toDate() : new Date()
            } : undefined,
            createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
            updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date(),
        };
    }

    async sendMessage(chatRoomId: string, senderId: string, content: string): Promise<void> {
        const messagesRef = collection(db, this.chatRoomsCollection, chatRoomId, this.messagesCollection);
        // Use serverTimestamp for consistent ordering across devices
        const timestamp = serverTimestamp();

        const newMessage = {
            senderId,
            content,
            createdAt: timestamp,
            chatRoomId
        };

        await addDoc(messagesRef, newMessage);

        // Update chat room with last message and updatedAt
        const chatRoomRef = doc(db, this.chatRoomsCollection, chatRoomId);
        await updateDoc(chatRoomRef, {
            lastMessage: newMessage,
            updatedAt: timestamp
        });
    }

    async getMessages(chatRoomId: string): Promise<Message[]> {
        const messagesRef = collection(db, this.chatRoomsCollection, chatRoomId, this.messagesCollection);
        const q = query(messagesRef, orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                senderId: data.senderId,
                content: data.content,
                // Handle pending writes where timestamp might be null
                createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
                chatRoomId: data.chatRoomId
            };
        });
    }

    subscribeToMessages(chatRoomId: string, callback: (messages: Message[]) => void): () => void {
        const messagesRef = collection(db, this.chatRoomsCollection, chatRoomId, this.messagesCollection);
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    senderId: data.senderId,
                    content: data.content,
                    // Handle pending writes where timestamp might be null
                    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
                    chatRoomId: data.chatRoomId
                };
            });
            callback(messages);
        });
    }

    async getAllUsers(): Promise<User[]> {
        const usersRef = collection(db, this.usersCollection);
        const snapshot = await getDocs(usersRef);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                email: data.email,
                displayName: data.displayName,
                photoURL: data.photoURL,
                emailVerified: data.emailVerified,
                username: data.username
            } as User;
        });
    }
}
