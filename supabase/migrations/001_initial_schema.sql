-- ============================================================
-- Arré Unposted — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Tables ──────────────────────────────────────────────────

create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  email       text,
  is_anonymous boolean default true not null,
  created_at  timestamp with time zone default timezone('utc', now()) not null,
  updated_at  timestamp with time zone default timezone('utc', now()) not null
);

create table public.entries (
  id                 uuid default gen_random_uuid() primary key,
  user_id            uuid references public.profiles(id) on delete cascade not null,
  mode               text not null,
  transcript         text,
  ai_summary         text,
  ai_summary_short   text,
  mood_word          text,
  processing_status  text default 'pending' not null,
  created_at         timestamp with time zone default timezone('utc', now()) not null,
  updated_at         timestamp with time zone default timezone('utc', now()) not null
);

create table public.emotion_fingerprint (
  id                    uuid default gen_random_uuid() primary key,
  user_id               uuid references public.profiles(id) on delete cascade not null unique,
  themes                text[] default '{}' not null,
  dominant_emotions     text[] default '{}' not null,
  relationship_contexts text[] default '{}' not null,
  life_phase_signals    text[] default '{}' not null,
  entry_count           integer default 0 not null,
  last_updated          timestamp with time zone default timezone('utc', now()) not null
);

create table public.sessions (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references public.profiles(id) on delete cascade not null,
  entry_id         uuid references public.entries(id) on delete set null,
  questions_asked  jsonb default '[]' not null,
  current_mode     text not null,
  status           text default 'active' not null,
  created_at       timestamp with time zone default timezone('utc', now()) not null,
  updated_at       timestamp with time zone default timezone('utc', now()) not null
);

-- ── Triggers ────────────────────────────────────────────────

-- Auto-create a profile row whenever a new auth user is created.
-- Works for both anonymous sign-ins and email sign-ups.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, is_anonymous)
  values (
    new.id,
    new.email,
    coalesce((new.raw_app_meta_data->>'provider') = 'anonymous', false)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at current on every row update.
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger handle_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger handle_updated_at
  before update on public.entries
  for each row execute function public.handle_updated_at();

create trigger handle_updated_at
  before update on public.sessions
  for each row execute function public.handle_updated_at();

-- ── Row Level Security ───────────────────────────────────────

alter table public.profiles          enable row level security;
alter table public.entries           enable row level security;
alter table public.emotion_fingerprint enable row level security;
alter table public.sessions          enable row level security;

-- profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- entries
create policy "Users can view own entries"
  on public.entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own entries"
  on public.entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own entries"
  on public.entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own entries"
  on public.entries for delete
  using (auth.uid() = user_id);

-- emotion_fingerprint
create policy "Users can view own fingerprint"
  on public.emotion_fingerprint for select
  using (auth.uid() = user_id);

create policy "Users can insert own fingerprint"
  on public.emotion_fingerprint for insert
  with check (auth.uid() = user_id);

create policy "Users can update own fingerprint"
  on public.emotion_fingerprint for update
  using (auth.uid() = user_id);

-- sessions
create policy "Users can view own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.sessions for update
  using (auth.uid() = user_id);
