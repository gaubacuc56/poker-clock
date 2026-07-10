-- poker-clock: short, public projector links
--
-- Typing a full UUID into a TV remote is unusable. This adds a short,
-- human-typeable `join_code` per tournament and makes the projector view
-- work without signing in — a TV just opens /p/:code.
--
-- Two distinct exposure decisions here, deliberately different:
-- * `tournaments` stays fully owner-scoped (RLS unchanged). Anonymous
--   lookup goes through `get_tournament_by_join_code`, a SECURITY DEFINER
--   function that returns every column except `owner_id` and only for a
--   row matching the exact code — it never allows scanning/listing
--   tournaments, only a single exact lookup.
-- * `clock_states` gets a genuinely public SELECT policy. Its contents
--   (level index, pause state, timestamps) are low-sensitivity, and
--   Supabase Realtime enforces RLS on `postgres_changes` subscriptions —
--   an anonymous viewer can't get live countdown updates at all unless
--   the table itself is selectable by the `anon` role. Unlike
--   `tournaments`, there's no per-row secret to gate this on, so it's
--   open to anyone rather than scoped by a function.

alter table tournaments
  add column if not exists join_code text;

-- Backfill any pre-existing rows with a random unique code before making
-- the column NOT NULL + UNIQUE (harmless if the table is empty).
update tournaments
  set join_code = upper(substr(md5(random()::text || id::text), 1, 5))
  where join_code is null;

alter table tournaments
  alter column join_code set not null;

alter table tournaments
  add constraint tournaments_join_code_key unique (join_code);

create index if not exists tournaments_join_code_idx on tournaments (join_code);

-- Public read of live clock state, for anonymous Realtime subscribers.
create policy "clock_states_select_public" on clock_states
  for select using (true);

-- Public single-row lookup by code, exposing every tournament column
-- except owner_id. SECURITY DEFINER bypasses the owner-scoped RLS on
-- `tournaments` internally, but only for the one matching row.
create or replace function get_tournament_by_join_code(p_join_code text)
returns table (
  id uuid,
  name text,
  status text,
  currency text,
  buy_in_cents integer,
  fee_cents integer,
  bounty_amount_cents integer,
  guaranteed_prize_pool_cents integer,
  starting_stack integer,
  max_players_per_table integer,
  min_entrants integer,
  max_entrants integer,
  entrant_count integer,
  eliminated_count integer,
  rebuy_count integer,
  add_on_count integer,
  late_reg_level integer,
  allow_rebuy boolean,
  allow_add_on boolean,
  blind_levels jsonb,
  payout_tiers jsonb,
  sounds jsonb,
  join_code text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    t.id, t.name, t.status, t.currency, t.buy_in_cents, t.fee_cents,
    t.bounty_amount_cents, t.guaranteed_prize_pool_cents, t.starting_stack,
    t.max_players_per_table, t.min_entrants, t.max_entrants, t.entrant_count,
    t.eliminated_count, t.rebuy_count, t.add_on_count, t.late_reg_level,
    t.allow_rebuy, t.allow_add_on, t.blind_levels, t.payout_tiers, t.sounds,
    t.join_code, t.created_at, t.updated_at
  from tournaments t
  where t.join_code = upper(p_join_code);
$$;

grant execute on function get_tournament_by_join_code(text) to anon, authenticated;
