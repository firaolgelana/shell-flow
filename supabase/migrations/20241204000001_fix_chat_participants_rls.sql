-- Fix infinite recursion in chat_participants policy

-- Drop the problematic policy
drop policy if exists "Participants can view other participants" on public.chat_participants;

-- Create a simpler policy that doesn't cause recursion
-- Users can view chat_participants records where they are a participant
create policy "Users can view chat participants"
  on public.chat_participants for select
  using (user_id = auth.uid());

-- Allow users to insert themselves as participants (for creating chat rooms)
create policy "Users can insert chat participants"
  on public.chat_participants for insert
  with check (user_id = auth.uid());

-- Allow inserting other participants if the user is already a participant
-- This is needed when creating a new chat room with multiple participants
create policy "Participants can add others"
  on public.chat_participants for insert
  with check (
    exists (
      select 1 from public.chat_participants cp
      where cp.chat_room_id = chat_participants.chat_room_id
      and cp.user_id = auth.uid()
    )
  );
