import React from 'react';
import { ShellCard as ShellCardType } from '../types';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { TimelinePreview } from './TimelinePreview';
import { Heart, MessageCircle, Share2 } from 'lucide-react';

interface ShellCardProps {
    card: ShellCardType;
    onCopy?: () => void;
    onLike?: () => void;
}

export const ShellCard: React.FC<ShellCardProps> = ({ card, onCopy, onLike }) => {
    return (
        <div className="bg-card border border-border rounded-lg p-4 mb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                        <AvatarImage src={card.user.avatar} alt={card.user.username} />
                        <AvatarFallback>{card.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-gray-900">{card.user.username}</p>
                        <p className="text-xs text-gray-500">@{card.user.username.toLowerCase()}</p>
                    </div>
                </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-gray-900 mb-3">{card.shell.title}</h3>

            {/* Timeline Preview */}
            <div className="mb-4">
                <TimelinePreview tasks={card.shell.tasks} max={3} />
            </div>

            {/* Actions Row */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 text-gray-500">
                    <button className="flex items-center gap-1 hover:text-red-500 transition" onClick={onLike}>
                        <Heart size={18} fill={card.isLiked ? 'currentColor' : 'none'} />
                        <span className="text-sm">{card.likes}</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-500 transition">
                        <MessageCircle size={18} />
                        <span className="text-sm">{card.comments}</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-indigo-500 transition">
                        <Share2 size={18} />
                    </button>
                </div>
            </div>

            {/* Copy Button */}
            <Button variant="secondary" size="default" className="w-full" onClick={onCopy}>
                Copy Shell
            </Button>
        </div>
    );
};
