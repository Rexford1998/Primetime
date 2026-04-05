-- Create player_profiles table linked to auth.users
create table if not exists public.player_profiles (
  id uuid primary key default auth.uid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  player_name text not null,
  email text,
  stats jsonb default '{"games_played": 0, "wins": 0, "losses": 0}'::jsonb,
  last_seen_at timestamp with time zone default now(),
  is_online boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create index for quick lookups
create index if not exists idx_player_profiles_user_id on public.player_profiles(user_id);
create index if not exists idx_player_profiles_is_online on public.player_profiles(is_online);

-- Enable RLS on player_profiles
alter table public.player_profiles enable row level security;

-- RLS policies
create policy "player_profiles_select_own" on public.player_profiles
  for select using (auth.uid() = user_id or true);

create policy "player_profiles_update_own" on public.player_profiles
  for update using (auth.uid() = user_id);

create policy "player_profiles_insert_own" on public.player_profiles
  for insert with check (auth.uid() = user_id);
