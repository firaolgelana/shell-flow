-- Function to get all participants for a list of chat rooms
-- This bypasses RLS to avoid recursion issues when users need to see other participants
create or replace function public.get_chat_participants(room_ids uuid[])
returns table (
  chat_room_id uuid,
  user_id uuid
)
language plpgsql
security definer
as $$
begin
  return query
  select cp.chat_room_id, cp.user_id
  from public.chat_participants cp
  where cp.chat_room_id = any(room_ids);
end;
$$;

-- Backfill last_message for existing chat rooms
-- This updates chat_rooms with the most recent message found in the messages table
update public.chat_rooms cr
set last_message = (
  select to_jsonb(m)
  from (
    select 
      sender_id as "senderId", 
      content, 
      created_at as "createdAt", 
      chat_room_id as "chatRoomId"
    from public.messages
    where chat_room_id = cr.id
    order by created_at desc
    limit 1
  ) m
)
where last_message is null;
