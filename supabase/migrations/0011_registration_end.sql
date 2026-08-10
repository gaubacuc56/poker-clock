-- poker-clock: the registration-close announcement
--
-- One nullable column, backing the projector line "Reg End: Level 8 ( 20h30 )".
--
-- Only the time is new. The level in that line is `late_reg_level`, which
-- already exists and already means exactly this — deliberately not a second
-- column, so the sign on the TV and the rule the app enforces are one number
-- and cannot disagree. A `late_reg_level` of 0 announces nothing.
--
-- `reg_end_time` is a bare time of day, without a date on purpose: the room
-- reads it off the wall, and a tournament running behind simply reaches the
-- level later than the sign says. Stored as text in `HH:mm` — the exact string
-- an `<input type="time">` produces and the app formats — rather than as a
-- `time`, whose `HH:MM:SS` output would have to be trimmed on every read for a
-- precision nobody enters.

alter table tournaments
  add column if not exists reg_end_time text;

-- Re-declared to expose the new column. The projector reads the tournament
-- through this function, and the projector is the only screen this line is for,
-- so a column missing here would make the whole feature invisible.
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
  reg_end_time text,
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
    t.reg_end_time,
    t.created_at, t.updated_at
  from tournaments t
  where t.join_code = upper(p_join_code);
$$;

grant execute on function get_tournament_by_join_code(text) to anon, authenticated;
