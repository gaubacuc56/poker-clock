-- poker-clock initial schema
-- Run this in the Supabase SQL editor, or via `supabase db push` if you adopt the CLI.
--
-- Design notes:
-- * Every table is owned by the authenticated organizer (owner_id -> auth.uid()) and
--   locked down with RLS. There is no shared/public data — each organizer only ever
--   sees their own tournaments.
-- * The app never tracks individual players — only aggregate counts. entrant_count,
--   eliminated_count, rebuy_count and add_on_count are plain counters the admin edits
--   live from the app; there is no players/registrations table.
-- * Blind levels and payout tiers are likewise not a separate shared "structure"
--   library — each tournament owns exactly one blind schedule and one payout split,
--   always directly editable, so they are embedded as jsonb columns on tournaments
--   instead of their own tables.
-- * clock_states holds the live countdown state, one row per tournament, so Control
--   (writer) and Projector (reader) can run on different devices via Supabase
--   Realtime instead of same-browser-tab BroadcastChannel.

create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- tournaments
-- ---------------------------------------------------------------------------

create table if not exists tournaments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  name text not null,
  status text not null default 'setup'
    check (status in ('setup', 'registering', 'running', 'paused', 'final_table', 'complete')),

  currency text not null default 'USD' check (currency in ('USD', 'VND', 'KEYS')),
  buy_in_cents integer not null default 0,
  fee_cents integer not null default 0,
  bounty_amount_cents integer,
  guaranteed_prize_pool_cents integer,

  starting_stack integer not null default 0,
  max_players_per_table integer not null default 9,
  min_entrants integer,
  max_entrants integer,

  -- Aggregate counters the admin edits live — no per-player tracking at all.
  entrant_count integer not null default 0,
  eliminated_count integer not null default 0,
  rebuy_count integer not null default 0,
  add_on_count integer not null default 0,

  late_reg_level integer not null default 0,
  allow_rebuy boolean not null default false,
  allow_add_on boolean not null default false,

  -- BlindLevel[] — { level, smallBlind, bigBlind, ante, isBigBlindAnte, durationSeconds, isBreak, breakLabel?, colorUp? }
  blind_levels jsonb not null default '[]'::jsonb,
  -- PayoutTier[] — { position, percentage }
  payout_tiers jsonb not null default '[]'::jsonb,
  -- SoundSettings — { nextLevel, breakStart, breakEnd, warning5s, warning10s, warning30s, warning60s }
  sounds jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tournaments_owner_id_idx on tournaments (owner_id);

drop trigger if exists tournaments_set_updated_at on tournaments;
create trigger tournaments_set_updated_at
  before update on tournaments
  for each row execute function set_updated_at();

alter table tournaments enable row level security;

create policy "tournaments_select_own" on tournaments
  for select using (owner_id = auth.uid());
create policy "tournaments_insert_own" on tournaments
  for insert with check (owner_id = auth.uid());
create policy "tournaments_update_own" on tournaments
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "tournaments_delete_own" on tournaments
  for delete using (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- clock_states (one live row per tournament, for cross-device Realtime sync)
-- ---------------------------------------------------------------------------

create table if not exists clock_states (
  tournament_id uuid primary key references tournaments (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  current_level_index integer not null default 0,
  level_started_at_epoch_ms bigint not null,
  paused_accumulated_ms bigint not null default 0,
  is_paused boolean not null default false,
  paused_at_epoch_ms bigint,
  is_muted boolean not null default false,

  updated_at timestamptz not null default now()
);

drop trigger if exists clock_states_set_updated_at on clock_states;
create trigger clock_states_set_updated_at
  before update on clock_states
  for each row execute function set_updated_at();

alter table clock_states enable row level security;

create policy "clock_states_select_own" on clock_states
  for select using (owner_id = auth.uid());
create policy "clock_states_insert_own" on clock_states
  for insert with check (owner_id = auth.uid());
create policy "clock_states_update_own" on clock_states
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "clock_states_delete_own" on clock_states
  for delete using (owner_id = auth.uid());

-- Required for Supabase Realtime postgres_changes subscriptions on this table.
alter publication supabase_realtime add table clock_states;
