-- ============================================================================
-- DealMatch — Supabase schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('founder', 'investor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type funding_stage as enum ('pre_seed', 'seed', 'series_a');
exception when duplicate_object then null; end $$;

do $$ begin
  create type request_status as enum ('pending', 'accepted', 'declined');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  role         user_role not null,
  is_premium   boolean not null default false,
  verified     boolean not null default false,
  onboarded    boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- founder_profiles
-- ---------------------------------------------------------------------------
create table if not exists public.founder_profiles (
  id            uuid primary key references public.profiles (id) on delete cascade,
  company_name  text not null,
  one_liner     text not null,
  funding_stage funding_stage not null,
  ticket_size   integer not null,            -- in EUR thousands (25, 50, 100, 200)
  industry      text not null,               -- FinTech / HealthTech / SaaS / Other
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- investor_profiles
-- ---------------------------------------------------------------------------
create table if not exists public.investor_profiles (
  id            uuid primary key references public.profiles (id) on delete cascade,
  name          text not null,
  background    text not null,
  focus         text[] not null default '{}',          -- industry preferences
  ticket_min    integer not null,                       -- EUR thousands
  ticket_max    integer not null,                       -- EUR thousands
  stage_prefs   funding_stage[] not null default '{}',
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- match_requests — directional intent. Becomes a match when accepted.
-- ---------------------------------------------------------------------------
create table if not exists public.match_requests (
  id          uuid primary key default gen_random_uuid(),
  from_user   uuid not null references public.profiles (id) on delete cascade,
  to_user     uuid not null references public.profiles (id) on delete cascade,
  status      request_status not null default 'pending',
  created_at  timestamptz not null default now(),
  unique (from_user, to_user)
);

-- ---------------------------------------------------------------------------
-- matches — created when a request is accepted. user_low < user_high keeps
-- the pair unique regardless of who initiated.
-- ---------------------------------------------------------------------------
create table if not exists public.matches (
  id          uuid primary key default gen_random_uuid(),
  user_low    uuid not null references public.profiles (id) on delete cascade,
  user_high   uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_low, user_high),
  check (user_low < user_high)
);

-- ---------------------------------------------------------------------------
-- messages — chat per match
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.matches (id) on delete cascade,
  sender_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);
create index if not exists messages_match_idx on public.messages (match_id, created_at);

-- ---------------------------------------------------------------------------
-- feed_views — tracks which candidates were served to a viewer on a day,
-- used to enforce the 5/day limit for free users.
-- ---------------------------------------------------------------------------
create table if not exists public.feed_views (
  viewer_id     uuid not null references public.profiles (id) on delete cascade,
  candidate_id  uuid not null references public.profiles (id) on delete cascade,
  served_on     date not null default current_date,
  primary key (viewer_id, candidate_id, served_on)
);

-- ============================================================================
-- Helper: create a profiles row automatically on signup.
-- Role is read from the user metadata supplied at signUp().
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'founder')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Helper: accept a match request -> create the match (transactional).
-- ============================================================================
create or replace function public.accept_match_request(request_id uuid)
returns public.matches
language plpgsql
security definer set search_path = public
as $$
declare
  req public.match_requests;
  lo uuid;
  hi uuid;
  result public.matches;
begin
  select * into req from public.match_requests where id = request_id;
  if req is null then
    raise exception 'request not found';
  end if;
  if req.to_user <> auth.uid() then
    raise exception 'not authorized to accept this request';
  end if;

  update public.match_requests set status = 'accepted' where id = request_id;

  lo := least(req.from_user, req.to_user);
  hi := greatest(req.from_user, req.to_user);

  insert into public.matches (user_low, user_high)
  values (lo, hi)
  on conflict (user_low, user_high) do update set user_low = excluded.user_low
  returning * into result;

  return result;
end;
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles          enable row level security;
alter table public.founder_profiles  enable row level security;
alter table public.investor_profiles enable row level security;
alter table public.match_requests    enable row level security;
alter table public.matches           enable row level security;
alter table public.messages          enable row level security;
alter table public.feed_views        enable row level security;

-- profiles: anyone authenticated can read (needed for the feed); you may only
-- write your own row. is_premium / verified are managed server-side.
drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- founder/investor profiles: readable by all authenticated, writable by owner.
drop policy if exists "founder readable" on public.founder_profiles;
create policy "founder readable" on public.founder_profiles
  for select to authenticated using (true);
drop policy if exists "founder write own" on public.founder_profiles;
create policy "founder write own" on public.founder_profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "investor readable" on public.investor_profiles;
create policy "investor readable" on public.investor_profiles
  for select to authenticated using (true);
drop policy if exists "investor write own" on public.investor_profiles;
create policy "investor write own" on public.investor_profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- match_requests: you can see requests you sent or received; create only your own.
drop policy if exists "requests visible" on public.match_requests;
create policy "requests visible" on public.match_requests
  for select to authenticated using (from_user = auth.uid() or to_user = auth.uid());
drop policy if exists "requests insert own" on public.match_requests;
create policy "requests insert own" on public.match_requests
  for insert to authenticated with check (from_user = auth.uid());
drop policy if exists "requests update received" on public.match_requests;
create policy "requests update received" on public.match_requests
  for update to authenticated using (to_user = auth.uid());

-- matches: visible to the two participants.
drop policy if exists "matches visible" on public.matches;
create policy "matches visible" on public.matches
  for select to authenticated using (user_low = auth.uid() or user_high = auth.uid());

-- messages: visible/insertable only within a match you belong to.
drop policy if exists "messages visible" on public.messages;
create policy "messages visible" on public.messages
  for select to authenticated using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and (m.user_low = auth.uid() or m.user_high = auth.uid())
    )
  );
drop policy if exists "messages insert" on public.messages;
create policy "messages insert" on public.messages
  for insert to authenticated with check (
    sender_id = auth.uid() and exists (
      select 1 from public.matches m
      where m.id = match_id and (m.user_low = auth.uid() or m.user_high = auth.uid())
    )
  );

-- feed_views: each user manages their own log.
drop policy if exists "feed_views own" on public.feed_views;
create policy "feed_views own" on public.feed_views
  for all to authenticated using (viewer_id = auth.uid()) with check (viewer_id = auth.uid());

-- Realtime for chat
alter publication supabase_realtime add table public.messages;
