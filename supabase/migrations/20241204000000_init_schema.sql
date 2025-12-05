-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  display_name text,
  photo_url text,
  username text unique,
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- TASKS
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  date date not null,
  start_time text,
  duration integer,
  category text default 'work',
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.tasks enable row level security;

create policy "Users can view their own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- SETTINGS
create table public.settings (
  user_id uuid references auth.users not null primary key,
  theme text default 'system',
  language text default 'en',
  timezone text default 'UTC',
  email_notifications boolean default true,
  push_notifications boolean default true,
  task_reminders boolean default true,
  weekly_digest boolean default true,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.settings enable row level security;

create policy "Users can view their own settings"
  on public.settings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own settings"
  on public.settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on public.settings for update
  using (auth.uid() = user_id);

-- CHAT ROOMS
create table public.chat_rooms (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.chat_rooms enable row level security;

-- CHAT PARTICIPANTS
create table public.chat_participants (
  chat_room_id uuid references public.chat_rooms not null,
  user_id uuid references auth.users not null,
  primary key (chat_room_id, user_id)
);

alter table public.chat_participants enable row level security;

-- MESSAGES
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  chat_room_id uuid references public.chat_rooms not null,
  sender_id uuid references auth.users not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

-- Chat Policies
-- Participants can view their chat rooms
create policy "Participants can view their chat rooms"
  on public.chat_rooms for select
  using (
    exists (
      select 1 from public.chat_participants
      where chat_room_id = public.chat_rooms.id
      and user_id = auth.uid()
    )
  );

-- Participants can view participants in their rooms
create policy "Participants can view other participants"
  on public.chat_participants for select
  using (
    exists (
      select 1 from public.chat_participants cp
      where cp.chat_room_id = public.chat_participants.chat_room_id
      and cp.user_id = auth.uid()
    )
  );

-- Participants can view messages in their rooms
create policy "Participants can view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.chat_participants
      where chat_room_id = public.messages.chat_room_id
      and user_id = auth.uid()
    )
  );

-- Participants can insert messages in their rooms
create policy "Participants can insert messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.chat_participants
      where chat_room_id = public.messages.chat_room_id
      and user_id = auth.uid()
    )
  );

-- FOLLOWS
create table public.follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references auth.users not null,
  following_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(follower_id, following_id)
);

alter table public.follows enable row level security;

create policy "Public follows are viewable by everyone"
  on public.follows for select
  using (true);

create policy "Users can follow others"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on public.follows for delete
  using (auth.uid() = follower_id);
