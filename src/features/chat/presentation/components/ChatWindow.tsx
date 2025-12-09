import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Message } from '@/features/chat/domain/Message';
import { GetMessages } from '@/features/chat/application/GetMessages';
import { SendMessage } from '@/features/chat/application/SendMessage';
import { chatRepository } from '@/features/chat/infrastructure';
import { useAuth } from '@/features/auth/presentation/useAuth';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/shared/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Send } from 'lucide-react';
import { format } from 'date-fns';

interface ChatWindowProps {
    chatRoomId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chatRoomId }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const { user: currentUser } = useAuth();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Memoize use case instances to prevent recreation on every render
    const getMessages = useMemo(() => new GetMessages(chatRepository), []);
    const sendMessage = useMemo(() => new SendMessage(chatRepository), []);

    useEffect(() => {
        // Initial fetch
        getMessages.execute(chatRoomId).then(setMessages).catch(err => console.error("Failed to load initial messages", err));

        const unsubscribe = getMessages.subscribe(chatRoomId, (msgs) => {
            setMessages(msgs);
        });
        return () => unsubscribe();
    }, [chatRoomId]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        try {
            await sendMessage.execute(chatRoomId, currentUser.id, newMessage);
            setNewMessage('');
            // Realtime subscription will handle the UI update automatically
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    return (
        <Card className="h-full flex flex-col rounded-l-none border-l-0 gap-0 py-0">
            <CardHeader className="border-b py-4 flex-shrink-0">
                <CardTitle className="text-base">Chat</CardTitle>
            </CardHeader>

            {/* Messages container - scrollable */}
            <CardContent className="flex-1 overflow-y-auto p-4 min-h-0">
                <div className="flex flex-col gap-4">
                    {messages.map((msg) => {
                        const isMe = msg.senderId === currentUser?.id;
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-lg px-4 py-2 ${isMe
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                        }`}
                                >
                                    <p className="text-sm">{msg.content}</p>
                                    <span className="text-[10px] opacity-70 block text-right mt-1">
                                        {format(msg.createdAt, 'HH:mm')}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </CardContent>

            {/* Input bar - fixed at bottom */}
            <CardFooter className="p-4 border-t flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
};
