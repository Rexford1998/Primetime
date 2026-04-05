-- Create join table to link players to game sessions (allows for session resumption)
create table if not exists public.player_game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.player_profiles(user_id) on delete cascade,
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  player_number integer not null, -- 1 or 2
  is_active boolean default true,
  joined_at timestamp with time zone default now(),
  left_at timestamp with time zone,
  unique(session_id, player_number)
);

-- Create indexes for quick lookups
create index if not exists idx_player_game_sessions_user on public.player_game_sessions(user_id);
create index if not exists idx_player_game_sessions_session on public.player_game_sessions(session_id);
create index if not exists idx_player_game_sessions_active on public.player_game_sessions(user_id, is_active);

-- Enable RLS
alter table public.player_game_sessions enable row level security;

-- RLS policies
create policy "player_game_sessions_select" on public.player_game_sessions
  for select using (auth.uid() = user_id or true);

create policy "player_game_sessions_insert" on public.player_game_sessions
  for insert with check (auth.uid() = user_id);

create policy "player_game_sessions_update" on public.player_game_sessions
  for update using (auth.uid() = user_id);
