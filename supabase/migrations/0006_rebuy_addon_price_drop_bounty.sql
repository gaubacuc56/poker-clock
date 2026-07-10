-- poker-clock: per-tournament rebuy/add-on price, drop the bounty feature
--
-- The bounty feature (a flat amount awarded per knockout) is being removed
-- entirely — not just from the UI, the column goes too.
--
-- rebuy_price_cents / add_on_price_cents: a rebuy and an add-on used to be
-- assumed to always cost exactly buy_in_cents. Now each can have its own
-- price, set once at tournament setup (same convention as every other
-- money column: hundredths of the tournament's currency). Null means "not
-- set" — the app falls back to buy_in_cents for tournaments created before
-- this shipped.

alter table tournaments
  drop column if exists bounty_amount_cents,
  add column if not exists rebuy_price_cents bigint,
  add column if not exists add_on_price_cents bigint;

-- Re-declare with bounty_amount_cents removed and the two new price columns
-- added. Postgres won't let `create or replace function` change a
-- function's return row shape (only its body), so the old signature must
-- be dropped first.
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
    t.created_at, t.updated_at
  from tournaments t
  where t.join_code = upper(p_join_code);
$$;

grant execute on function get_tournament_by_join_code(text) to anon, authenticated;
