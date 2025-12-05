-- Enable Realtime for messages and chat_rooms tables
-- This allows the client to receive updates when new messages are sent

-- Add messages table to the realtime publication
alter publication supabase_realtime add table public.messages;

-- Add chat_rooms table to the realtime publication (for updating last message in the list)
alter publication supabase_realtime add table public.chat_rooms;
