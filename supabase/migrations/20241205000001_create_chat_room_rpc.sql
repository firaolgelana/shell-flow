-- Function to create a chat room or return an existing one
-- This function handles the creation of the chat room and its participants atomically
-- It also bypasses RLS for the creation process to avoid permission issues
create or replace function public.create_chat_room(participant_ids uuid[])
returns uuid
language plpgsql
security definer
as $$
declare
  room_id uuid;
  existing_room_id uuid;
  sorted_participants uuid[];
begin
  -- Ensure current user is in the participants list
  if not (auth.uid() = any(participant_ids)) then
    raise exception 'Current user must be a participant';
  end if;

  -- Sort participants for consistent comparison
  select array_agg(x order by x) into sorted_participants from unnest(participant_ids) x;

  -- Check for existing room with exact participants
  -- We group by chat_room_id and check if the array of participants matches exactly
  select cp.chat_room_id into existing_room_id
  from public.chat_participants cp
  group by cp.chat_room_id
  having 
    count(*) = array_length(sorted_participants, 1) and
    array_agg(cp.user_id order by cp.user_id) = sorted_participants;
  
  if existing_room_id is not null then
    return existing_room_id;
  end if;

  -- Create new room
  insert into public.chat_rooms (created_at, updated_at)
  values (now(), now())
  returning id into room_id;

  -- Insert participants
  insert into public.chat_participants (chat_room_id, user_id)
  select room_id, unnest(participant_ids);

  return room_id;
end;
$$;
