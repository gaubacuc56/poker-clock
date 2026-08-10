-- poker-clock: per-tournament projector settings
--
-- The projector runs in a different browser (the TV) from the operator's
-- app, so anything the TV needs can't live in a local preference — it has
-- to travel with the tournament row.
--
-- One jsonb bag rather than a column per setting, on purpose: the projector
-- is presentation, and its settings are expected to keep arriving (layouts,
-- toggles, per-tournament overrides). A new key here needs no migration, no
-- re-declaration of get_tournament_by_join_code below, and no change to the
-- hand-written database.types.ts — same treatment `sounds` already gets.
--
-- The trade is that Postgres can't check the shape; the app owns validation.
-- That's acceptable for presentation, and deliberately not how the money
-- columns are stored.
--
-- Current keys:
--   layout  'classic' | 'ledger' | 'panel' | 'dial' | 'card'
--           Absent = 'classic', the layout every tournament had before this.
--
-- (projector_background_id stays its own column — it predates this and is
-- referenced on its own.)

alter table tournaments
  add column if not exists projector jsonb not null default '{}'::jsonb;

-- Re-declared once to expose `projector`; the projector reads the tournament
-- through this function, so a column missing here is invisible to the TV.
-- Postgres won't let `create or replace function` change a function's return
-- row shape (only its body), so the old signature must be dropped first.
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
    t.created_at, t.updated_at
  from tournaments t
  where t.join_code = upper(p_join_code);
$$;

grant execute on function get_tournament_by_join_code(text) to anon, authenticated;
