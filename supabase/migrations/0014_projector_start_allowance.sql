-- poker-clock: the projector is told whether a scheduled start is allowed
--
-- The plan's running-tournament allowance is enforced in one place — the
-- `tournaments_enforce_plan_limits` trigger, on the very `status → running`
-- update that `advance_tournament_schedules` makes — so a scheduled tournament
-- belonging to an account that is already at its limit is refused and stays at
-- `setup`. That part worked.
--
-- What did not is that the screens do not wait for that write. They derive the
-- clock from the schedule so a TV with no app open anywhere starts on time,
-- which is the whole point of scheduling one. The control screen can tell when
-- a start would be refused — it reads the account's plan and can see its other
-- tournaments — but the public projector can see neither, so it went on counting
-- down a tournament the database had refused to start. An allowance enforced in
-- the row and bypassed on the television is not enforced.
--
-- `get_tournament_by_join_code` is re-declared to answer the question the
-- projector cannot answer for itself: may this tournament start itself right
-- now? It is the same comparison the trigger makes — the owner's allowance
-- against the owner's other tournaments in play — so the two cannot disagree
-- about what is allowed, only about when they were asked.
--
-- It is a boolean about a tournament whose join code the caller already has, and
-- it names neither the plan nor the number: enough for the screen to stop, and
-- nothing about the account beyond that.
--
-- `true` when the plan does not cap running tournaments, and `true` if the
-- account has no plan row at all — the same way `planLimits` treats an unknown
-- plan, since the database is what actually says no.

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
  schedule_repeat text,
  tournament_start_at timestamptz,
  schedule_weekdays smallint[],
  start_time text,
  schedule_dismissed_at timestamptz,
  registration_opened_at timestamptz,
  reg_end_time text,
  schedule_start_allowed boolean,
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
    t.schedule_repeat,
    t.tournament_start_at,
    t.schedule_weekdays, t.start_time,
    t.schedule_dismissed_at,
    t.registration_opened_at,
    t.reg_end_time,
    coalesce(
      (
        select
          pl.max_running_tour is null
          or (
            -- The owner's other tournaments in play. `id <> t.id` for the same
            -- reason the trigger excludes it: a tournament does not count
            -- against its own start.
            select count(*)
            from tournaments o
            where o.owner_id = t.owner_id
              and o.status in ('running', 'paused')
              and o.id <> t.id
          ) < pl.max_running_tour
        from account_plan(t.owner_id) pl
      ),
      true
    ) as schedule_start_allowed,
    t.created_at, t.updated_at
  from tournaments t
  where t.join_code = upper(p_join_code);
$$;

grant execute on function get_tournament_by_join_code(text) to anon, authenticated;
