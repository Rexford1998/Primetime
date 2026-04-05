-- Add new columns to game_sessions for session recovery and turn locking
alter table if exists public.game_sessions
add column if not exists current_player_id uuid references public.player_profiles(user_id) on delete set null,
add column if not exists current_turn_number integer default 0,
add column if not exists last_move_at timestamp with time zone default now(),
add column if not exists player_1_connected boolean default true,
add column if not exists player_2_connected boolean default true,
add column if not exists player_1_last_heartbeat timestamp with time zone default now(),
add column if not exists player_2_last_heartbeat timestamp with time zone default now(),
add column if not exists created_by_user_id uuid references public.player_profiles(user_id) on delete set null;

-- Create index for turn validation
create index if not exists idx_game_sessions_current_player on public.game_sessions(current_player_id);
create index if not exists idx_game_sessions_status on public.game_sessions(status);
