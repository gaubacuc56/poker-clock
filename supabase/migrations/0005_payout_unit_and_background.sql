-- poker-clock: payout unit (%/amount) + projector background image
--
-- payout_unit: payout tiers were always percentage-of-pool. Now a
-- tournament can instead split payouts as absolute amounts in its own
-- currency (summing to the guaranteed prize pool) — payout_tiers' jsonb
-- shape is unchanged (still `{ position, value }`; older rows may still
-- have `{ position, percentage }`, handled by the app's mapping layer, not
-- here), this just records which unit the stored values are in.
--
-- projector_background_id: references an entry in this app's bundled
-- config/base.json `backgrounds` list (an id, not a URL) — the actual
-- image files ship with the app itself, never uploaded by a user, so there
-- is nothing here to validate against a table.

alter table tournaments
  add column if not exists payout_unit text not null default 'percentage'
    check (payout_unit in ('percentage', 'amount')),
  add column if not exists projector_background_id text;

-- Re-declare with the two new columns added. Postgres won't let
-- `create or replace function` change a function's return row shape (only
-- its body), so the old signature must be dropped first.
drop function if exists get_tournament_by_join_code(text);

create function get_tournament_by_join_code(p_join_code text)
returns table (
  id uuid,
  name text,
  status text,
  currency text,
  buy_in_cents bigint,
  fee_cents bigint,
  bounty_amount_cents bigint,
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
  blind_levels jsonb,
  payout_tiers jsonb,
  payout_unit text,
  sounds jsonb,
  join_code text,
  projector_background_id text,
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
    t.allow_rebuy, t.allow_add_on, t.blind_levels, t.payout_tiers,
    t.payout_unit, t.sounds, t.join_code, t.projector_background_id,
    t.created_at, t.updated_at
  from tournaments t
  where t.join_code = upper(p_join_code);
$$;

grant execute on function get_tournament_by_join_code(text) to anon, authenticated;
