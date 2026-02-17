-- ============================================================
-- Friendr — 24-Hour Connection
-- Complete Supabase SQL Schema
-- Run this entire script in the Supabase SQL Editor.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  phone_number text,
  is_looking   boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────
-- 2. MATCHES
-- ─────────────────────────────────────────────────────────────
create table if not exists public.matches (
  id              uuid primary key default gen_random_uuid(),
  user_a          uuid not null references public.profiles(id) on delete cascade,
  user_b          uuid not null references public.profiles(id) on delete cascade,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default (now() + interval '24 hours'),
  user_a_revealed boolean not null default false,
  user_b_revealed boolean not null default false,

  constraint different_users check (user_a <> user_b)
);

-- Index for quickly finding a user's active match
create index if not exists idx_matches_user_a on public.matches(user_a);
create index if not exists idx_matches_user_b on public.matches(user_b);

-- Ensure a user can only have ONE active (non-expired) match at a time.
-- We use a function + trigger approach for this constraint.
create or replace function public.check_active_match()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.matches
    where (user_a = new.user_a or user_b = new.user_a)
      and expires_at > now()
      and id is distinct from new.id
  ) then
    raise exception 'User A already has an active match';
  end if;

  if exists (
    select 1 from public.matches
    where (user_a = new.user_b or user_b = new.user_b)
      and expires_at > now()
      and id is distinct from new.id
  ) then
    raise exception 'User B already has an active match';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_single_active_match on public.matches;
create trigger enforce_single_active_match
  before insert on public.matches
  for each row
  execute function public.check_active_match();

alter table public.matches enable row level security;

create policy "Users can view their own matches"
  on public.matches for select
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "Users can update their own matches"
  on public.matches for update
  using (auth.uid() = user_a or auth.uid() = user_b);

-- ─────────────────────────────────────────────────────────────
-- 3. MESSAGES
-- ─────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_match_id on public.messages(match_id);

alter table public.messages enable row level security;

-- Users can only read messages from matches they belong to
create policy "Users can read their match messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

-- Users can only insert messages into matches they belong to
create policy "Users can send messages to their match"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user_a = auth.uid() or m.user_b = auth.uid())
        and m.expires_at > now()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 4. FIND_MATCH FUNCTION
-- Atomically finds another is_looking user, creates a match,
-- and sets both users' is_looking to false.
-- Returns the match_id or null if no partner found.
-- ─────────────────────────────────────────────────────────────
create or replace function public.find_match(requesting_user_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  partner_id uuid;
  new_match_id uuid;
begin
  -- Lock and grab one waiting partner (skip the requesting user)
  select id into partner_id
  from public.profiles
  where is_looking = true
    and id <> requesting_user_id
  order by created_at asc
  limit 1
  for update skip locked;

  -- No partner found — just make sure requesting user is marked as looking
  if partner_id is null then
    update public.profiles
    set is_looking = true
    where id = requesting_user_id;
    return null;
  end if;

  -- Create the match
  insert into public.matches (user_a, user_b)
  values (requesting_user_id, partner_id)
  returning id into new_match_id;

  -- Mark both users as no longer looking
  update public.profiles
  set is_looking = false
  where id in (requesting_user_id, partner_id);

  return new_match_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 5. REALTIME — Enable realtime for messages and matches
-- ─────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.matches;
