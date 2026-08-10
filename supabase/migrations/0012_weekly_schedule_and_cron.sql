-- poker-clock: repeating schedules, and a lifecycle that runs without a browser
--
-- Two changes that only make sense together.
--
-- 1. A dated schedule describes one evening, so stopping the run clears it and
--    the organiser enters tomorrow's date tomorrow. A club that runs every
--    Friday was doing that every week. The columns below let the schedule be an
--    arrangement instead: days of the week and two times of day, set once.
--
-- 2. Every scheduled transition used to need a browser. The screens derive the
--    registration board and the clock from the schedule, so a TV that is on
--    shows the right thing at the right second — but nothing was *written*
--    unless an operator had the control screen open. The status a dashboard
--    reads, the clock_states row a run needs, and the eventual 'finished' all
--    waited on somebody's phone. A club that sets a Friday alarm and closes the
--    app is entitled to have Friday happen; that is a job for a scheduler, and
--    Postgres has one.
--
-- `schedule_repeat` decides which half of the schedule is read. The app never
-- mixes them:
--
--   once    registration_start_at + tournament_start_at
--   weekly  schedule_weekdays + registration_time + start_time
--
-- Times of day are text in `HH:mm`, matching `reg_end_time` from 0011 and the
-- string an `<input type="time">` produces. Weekdays are 0 = Sunday … 6 =
-- Saturday, read in UTC+7 like every other schedule value.
--
-- `schedule_dismissed_at` is the Dismiss half of an alarm: Stop on a weekly
-- tournament records the instant rather than clearing the days, and occurrences
-- that opened at or before it are skipped. The next day on the list still fires.
-- Turning the arrangement off means clearing `schedule_weekdays`.
--
-- KNOWN DUPLICATION. `tournament_occurrence` restates
-- `scheduleOccurrence` from src/domain/rules/tournamentSchedule.ts, and
-- `tournament_clock_finished` restates `isClockFinished` from
-- src/domain/rules/blindProgression.ts. Both are deliberate: the screens cannot
-- ask the database every 250ms, and a status that only updates when somebody is
-- looking is not a status. They can also drift, so change each pair together.
-- The schedule half is meant to be collapsed by having the API return the
-- resolved instants, at which point the client stops computing them at all.

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

alter table tournaments
  add column if not exists schedule_repeat text not null default 'once',
  add column if not exists schedule_weekdays smallint[] not null default '{}',
  add column if not exists registration_time text,
  add column if not exists start_time text,
  add column if not exists schedule_dismissed_at timestamptz;

alter table tournaments
  drop constraint if exists tournaments_schedule_repeat_check;

alter table tournaments
  add constraint tournaments_schedule_repeat_check
  check (schedule_repeat in ('once', 'weekly'));

-- Re-declared to expose the new columns. The projector reads the tournament
-- through this function and derives both the registration countdown and the
-- clock itself from the schedule, so a column missing here means the TV never
-- starts — which is the entire point of scheduling one.
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
  schedule_repeat text,
  registration_start_at timestamptz,
  tournament_start_at timestamptz,
  schedule_weekdays smallint[],
  registration_time text,
  start_time text,
  schedule_dismissed_at timestamptz,
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
    t.schedule_repeat,
    t.registration_start_at, t.tournament_start_at,
    t.schedule_weekdays, t.registration_time, t.start_time,
    t.schedule_dismissed_at,
    t.reg_end_time,
    t.created_at, t.updated_at
  from tournaments t
  where t.join_code = upper(p_join_code);
$$;

grant execute on function get_tournament_by_join_code(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Which occurrence a schedule is on
-- ---------------------------------------------------------------------------
--
-- A `once` schedule is its own occurrence. A `weekly` one is resolved the same
-- way the app resolves it: the most recent evening that has opened, is still
-- within its day, and has outlived the last dismissal — otherwise the next
-- evening to come, so a caller can see it is pending.
--
-- The 24-hour lifetime is what stops a single-weekday schedule treating last
-- week's evening as current right up to tonight's registration time.
--
-- All wall-clock values are UTC+7. Written as a plain 7-hour shift rather than a
-- named zone so it matches the app exactly and cannot drift if a zone database
-- is ever updated — Indochina Time has no daylight saving to model.
create or replace function tournament_occurrence(
  p_repeat text,
  p_registration_start_at timestamptz,
  p_tournament_start_at timestamptz,
  p_weekdays smallint[],
  p_registration_time text,
  p_start_time text,
  p_dismissed_at timestamptz,
  p_now timestamptz
)
returns table (opens_at timestamptz, starts_at timestamptz)
language plpgsql
immutable
as $$
declare
  v_offset constant interval := interval '7 hours';
  v_lifetime constant interval := interval '24 hours';
  v_opening_time text;
  v_today date;
  v_day date;
  v_opens timestamptz;
  v_starts timestamptz;
  v_back integer;
  v_ahead integer;
begin
  if coalesce(p_repeat, 'once') <> 'weekly' then
    return query select p_registration_start_at, p_tournament_start_at;
    return;
  end if;

  if p_weekdays is null or array_length(p_weekdays, 1) is null or p_start_time is null then
    return query select null::timestamptz, null::timestamptz;
    return;
  end if;

  -- No registration time means the doors and the start are the same moment.
  v_opening_time := coalesce(p_registration_time, p_start_time);
  v_today := ((p_now + v_offset) at time zone 'UTC')::date;

  -- Today first, then backwards.
  for v_back in 0..7 loop
    v_day := v_today - v_back;
    if extract(dow from v_day)::smallint = any (p_weekdays) then
      v_opens := ((v_day + v_opening_time::time) - v_offset) at time zone 'UTC';
      v_starts := ((v_day + p_start_time::time) - v_offset) at time zone 'UTC';
      if v_opens <= p_now then
        exit when p_now - v_opens >= v_lifetime;
        if p_dismissed_at is null or v_opens > p_dismissed_at then
          return query select v_opens, v_starts;
          return;
        end if;
      end if;
    end if;
  end loop;

  -- Nothing current: report the next one so it reads as pending.
  for v_ahead in 0..7 loop
    v_day := v_today + v_ahead;
    if extract(dow from v_day)::smallint = any (p_weekdays) then
      v_opens := ((v_day + v_opening_time::time) - v_offset) at time zone 'UTC';
      v_starts := ((v_day + p_start_time::time) - v_offset) at time zone 'UTC';
      if v_opens > p_now and (p_dismissed_at is null or v_opens > p_dismissed_at) then
        return query select v_opens, v_starts;
        return;
      end if;
    end if;
  end loop;

  return query select null::timestamptz, null::timestamptz;
end;
$$;

-- ---------------------------------------------------------------------------
-- Has this clock run out?
-- ---------------------------------------------------------------------------
--
-- The same rule `isClockFinished` applies, in the form that needs no loop:
-- measured from the start of the level the clock is on, a tournament is over
-- once as much time has passed as every remaining level puts together. Rolling
-- forward level by level only ever consumes those durations in order, so being
-- past the end of the last one is exactly that comparison.
--
-- `p_blind_levels` is the tournament's structure; the rest is its clock_states
-- row. A paused clock freezes at `paused_at_epoch_ms`, so a tournament paused
-- before the end is not finished — the same as on screen.
--
-- A structure with no levels is never finished. Without that guard it would have
-- nothing left to run and would finish itself the instant it started.
create or replace function tournament_clock_finished(
  p_blind_levels jsonb,
  p_current_level_index integer,
  p_level_started_at_epoch_ms bigint,
  p_paused_accumulated_ms bigint,
  p_is_paused boolean,
  p_paused_at_epoch_ms bigint,
  p_now timestamptz
)
returns boolean
language sql
immutable
as $$
  select
    jsonb_array_length(coalesce(p_blind_levels, '[]'::jsonb)) > 0
    and (
      (
        case
          when p_is_paused
            then coalesce(p_paused_at_epoch_ms, (extract(epoch from p_now) * 1000)::bigint)
          else (extract(epoch from p_now) * 1000)::bigint
        end
      )
      - p_level_started_at_epoch_ms
      - coalesce(p_paused_accumulated_ms, 0)
    ) >= (
      -- Every level from the one the clock is on to the last, in milliseconds.
      -- `ordinality` counts from 1, the level index from 0.
      select coalesce(sum((lvl ->> 'durationSeconds')::bigint), 0) * 1000
      from jsonb_array_elements(coalesce(p_blind_levels, '[]'::jsonb))
        with ordinality as levels(lvl, ord)
      where ord - 1 >= greatest(coalesce(p_current_level_index, 0), 0)
    );
$$;

-- ---------------------------------------------------------------------------
-- The writes a schedule implies, both ends of the lifecycle
-- ---------------------------------------------------------------------------
--
-- Idempotent by construction, so running it every minute is free after the first
-- pass: every branch is guarded on the status it changes, and the clock row is an
-- `on conflict do nothing` insert.
--
-- `level_started_at_epoch_ms` is the scheduled instant, never `now()` — a
-- tournament the job reaches forty seconds late is forty seconds in, not
-- starting fresh. Same rule the client uses when it adopts a derived clock.
--
-- Stop stays authoritative. It deletes the clock row and either clears a dated
-- schedule or records a dismissal, so `tournament_occurrence` no longer returns
-- an evening that has started and there is nothing here to re-insert.
create or replace function advance_tournament_schedules()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_occ record;
  v_changed integer := 0;
begin
  -- Front of the lifecycle: registration opens, then the clock starts.
  for v_row in
    select * from tournaments
    where status in ('setup', 'registering')
      and (
        schedule_repeat = 'weekly'
        or registration_start_at is not null
        or tournament_start_at is not null
      )
  loop
    select * into v_occ from tournament_occurrence(
      v_row.schedule_repeat,
      v_row.registration_start_at,
      v_row.tournament_start_at,
      v_row.schedule_weekdays,
      v_row.registration_time,
      v_row.start_time,
      v_row.schedule_dismissed_at,
      now()
    );

    if v_occ.starts_at is not null and now() >= v_occ.starts_at then
      insert into clock_states (
        tournament_id, owner_id, current_level_index, level_started_at_epoch_ms
      )
      values (
        v_row.id,
        v_row.owner_id,
        0,
        (extract(epoch from v_occ.starts_at) * 1000)::bigint
      )
      on conflict (tournament_id) do nothing;

      update tournaments set status = 'running' where id = v_row.id;
      v_changed := v_changed + 1;

    elsif v_occ.opens_at is not null
      and now() >= v_occ.opens_at
      and v_row.status = 'setup'
    then
      update tournaments set status = 'registering' where id = v_row.id;
      v_changed := v_changed + 1;
    end if;
  end loop;

  -- Back of the lifecycle: the last level has run out. Applies to manually
  -- started tournaments too — the status should be true whoever started it.
  --
  -- Only the status changes. The clock row stays exactly as it is, so the
  -- finished result keeps showing on the TV until the admin stops the
  -- tournament — the same thing `finishTournament` does in the app, and the
  -- reason Stop is what clears a run rather than this.
  for v_row in
    select t.id, t.blind_levels, c.*
    from tournaments t
    join clock_states c on c.tournament_id = t.id
    where t.status in ('running', 'paused')
  loop
    if tournament_clock_finished(
      v_row.blind_levels,
      v_row.current_level_index,
      v_row.level_started_at_epoch_ms,
      v_row.paused_accumulated_ms,
      v_row.is_paused,
      v_row.paused_at_epoch_ms,
      now()
    ) then
      update tournaments set status = 'finished' where id = v_row.id;
      v_changed := v_changed + 1;
    end if;
  end loop;

  return v_changed;
end;
$$;

-- Not granted to anon or authenticated: this runs as the scheduler, and a client
-- that could call it would be writing other owners' rows through a
-- `security definer` function.
revoke all on function advance_tournament_schedules() from public;

-- ---------------------------------------------------------------------------
-- Once a minute
-- ---------------------------------------------------------------------------
--
-- pg_cron lives in the postgres database and needs enabling once. On Supabase
-- this is Database -> Extensions -> pg_cron if the create is refused here.
--
-- A minute is the resolution a schedule is set at, so it is the resolution worth
-- polling. It is also only the bookkeeping cadence: the screens still derive the
-- countdown every 250ms, so nobody in the room sees a minute's lag.
create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule('advance-tournament-schedules');
exception
  when others then null;
end;
$$;

select cron.schedule(
  'advance-tournament-schedules',
  '* * * * *',
  $$select advance_tournament_schedules();$$
);
