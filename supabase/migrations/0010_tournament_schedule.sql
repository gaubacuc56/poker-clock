-- poker-clock: scheduled registration and start times
--
-- Two real timestamptz columns rather than a key in the `projector` jsonb bag:
-- these aren't presentation. The clock starts itself off `tournament_start_at`,
-- so the value has to be something Postgres can type-check, index and compare —
-- the same treatment the money columns get, and deliberately not the treatment
-- the projector's look-and-feel gets.
--
-- Stored as instants (timestamptz). The organiser picks them in UTC+7 and the
-- app converts on the way in and out; the database stays timezone-truthful and
-- no screen has to guess which clock a bare wall time was written on.
--
-- Both are nullable: an unscheduled tournament — the norm — has neither, and is
-- started by hand exactly as before.

alter table tournaments
  add column if not exists registration_start_at timestamptz,
  add column if not exists tournament_start_at timestamptz;

-- Re-declared to expose the two new columns. The projector reads the tournament
-- through this function, so a column missing here is invisible to the TV — and
-- the TV is precisely the screen that has to show the registration countdown.
-- Postgres won't let `create or replace function` change a function's return row
-- shape (only its body), so the old signature must be dropped first.
--
-- The column list stays explicit rather than `to_jsonb(t)`: this function is
-- `security definer` and granted to anon, so it whitelists what leaves the
-- table instead of blocklisting what must not.
drop function if exists get_tournament_by_join_code(text);

create function get_tournament_by_join_code(p_join_code text)
returns table (
  id uuid,
  name text,
  status text,
  currency text,
  buy_in_cents bigint,
  fee_cents bigint,
  guaranteed_prize_pool_cents bigint,
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
  rebuy_price_cents bigint,
  add_on_price_cents bigint,
  blind_levels jsonb,
  payout_tiers jsonb,
  payout_unit text,
  sounds jsonb,
  join_code text,
  projector_background_id text,
  projector jsonb,
  registration_start_at timestamptz,
  tournament_start_at timestamptz,
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
    t.guaranteed_prize_pool_cents, t.starting_stack,
    t.max_players_per_table, t.min_entrants, t.max_entrants, t.entrant_count,
    t.eliminated_count, t.rebuy_count, t.add_on_count, t.late_reg_level,
    t.allow_rebuy, t.allow_add_on, t.rebuy_price_cents, t.add_on_price_cents,
    t.blind_levels, t.payout_tiers,
    t.payout_unit, t.sounds, t.join_code, t.projector_background_id,
    t.projector,
    t.registration_start_at, t.tournament_start_at,
    t.created_at, t.updated_at
  from tournaments t
  where t.join_code = upper(p_join_code);
$$;

grant execute on function get_tournament_by_join_code(text) to anon, authenticated;
