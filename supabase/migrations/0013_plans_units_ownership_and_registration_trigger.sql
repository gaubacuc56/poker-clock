-- poker-clock: plans, per-user units, per-user backgrounds, and a registration
-- window the operator opens by hand.
--
-- Five changes, deliberately in one file — they all land together because they
-- share the same premise: an organiser is now an *account* with entitlements and
-- private assets, not just a row owner.
--
--   1. plans        what an account is allowed to do, by name
--   2. profiles     which plan an account is on, and for how long
--   3. backgrounds  images belong to the account that uploaded them
--   4. currencies   units are shared defaults plus per-account custom ones
--   5. registration `registration_start_at` / `registration_time` are gone; the
--                   only configurable instant is the tournament start, and the
--                   registration countdown is opened by hand within six hours of
--                   it.
--
-- Run this in the Supabase SQL editor, or via `supabase db push`.

-- ---------------------------------------------------------------------------
-- 1. plans — the entitlements, by name
-- ---------------------------------------------------------------------------
--
-- A plan is reference data, the same for every account, and read by everyone:
-- the settings screen names the account's plan and prints its allowances beside
-- what the account has actually used. Writing plans is a dashboard/SQL job, the
-- same as creating accounts — there is no policy that lets a client insert one,
-- which is also what stops an account promoting itself.
--
-- A null allowance is "no limit", not zero. That distinction is the reason these
-- are nullable rather than defaulted to some very large number: a plan that
-- deliberately does not cap something says so by leaving it empty.

create table if not exists plans (
  plan_code text primary key
    check (plan_code = upper(plan_code) and length(plan_code) > 0),
  -- Null = unlimited, for every one of the three.
  max_tour integer check (max_tour is null or max_tour >= 0),
  max_running_tour integer check (max_running_tour is null or max_running_tour >= 0),
  max_background integer check (max_background is null or max_background >= 0),
  created_at timestamptz not null default now()
);

insert into plans (plan_code, max_tour, max_running_tour, max_background) values
  ('BASIC', 10, 1, 10),
  ('MODERATOR', 100, 100, 100)
on conflict (plan_code) do update set
  max_tour = excluded.max_tour,
  max_running_tour = excluded.max_running_tour,
  max_background = excluded.max_background;

alter table plans enable row level security;

drop policy if exists "plans_select_all" on plans;
create policy "plans_select_all" on plans
  for select using (true);

-- ---------------------------------------------------------------------------
-- 2. profiles — the account's own row
-- ---------------------------------------------------------------------------
--
-- `auth.users` is Supabase-managed and not ours to add columns to, so the three
-- new user columns live here, one row per account, keyed by the same id.
--
-- All three are nullable, and each absence means something different:
--   plan_code  null → no plan named; the account is treated as BASIC
--   plan_start null → the plan has always been in force
--   plan_end   null → the plan does not expire
--
-- Read-only to its owner. Everything on this row is an entitlement, so allowing
-- the account to write it would be allowing it to grant itself one.

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  plan_code text default 'BASIC' references plans (plan_code) on delete set null,
  plan_start date default current_date,
  plan_end date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (plan_start is null or plan_end is null or plan_end >= plan_start)
);

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

alter table profiles enable row level security;

drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles
  for select using (id = auth.uid());

-- Accounts that existed before this migration.
insert into profiles (id)
select u.id from auth.users u
on conflict (id) do nothing;

-- …and every account created after it. `security definer` because the trigger
-- fires as whoever inserted into auth.users, which is not a role with rights on
-- public tables.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- The allowances actually in force for an account
-- ---------------------------------------------------------------------------
--
-- One place answers "what is this account allowed to do", and everything else —
-- the two limit triggers, the storage policy, the screen — asks it. A plan that
-- has not started yet or has already ended does not apply: the account falls
-- back to BASIC rather than to nothing, so an expired subscription degrades to
-- the free tier instead of locking the organiser out of their own tournaments.
--
-- `security definer` so the limit triggers can read profiles/plans while running
-- as the scheduler or as another account's write.

create or replace function account_plan(p_user uuid)
returns table (
  plan_code text,
  plan_start date,
  plan_end date,
  is_active boolean,
  max_tour integer,
  max_running_tour integer,
  max_background integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_profile profiles%rowtype;
  v_active boolean := false;
  v_code text;
begin
  select * into v_profile from profiles where id = p_user;

  v_active :=
    v_profile.plan_code is not null
    and (v_profile.plan_start is null or v_profile.plan_start <= current_date)
    and (v_profile.plan_end is null or v_profile.plan_end >= current_date);

  v_code := case when v_active then v_profile.plan_code else 'BASIC' end;

  return query
    select
      v_profile.plan_code,
      v_profile.plan_start,
      v_profile.plan_end,
      v_active,
      p.max_tour,
      p.max_running_tour,
      p.max_background
    from plans p
    where p.plan_code = v_code;
end;
$$;

-- What the settings screen reads: the caller's own plan, never anyone else's.
create or replace function get_my_plan()
returns table (
  plan_code text,
  plan_start date,
  plan_end date,
  is_active boolean,
  max_tour integer,
  max_running_tour integer,
  max_background integer
)
language sql
stable
security definer
set search_path = public
as $$
  select * from account_plan(auth.uid());
$$;

grant execute on function get_my_plan() to authenticated;
revoke all on function account_plan(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Enforcing the tournament allowances
-- ---------------------------------------------------------------------------
--
-- Both limits are counted against `new.owner_id`, never `auth.uid()`: the same
-- write can arrive from the account's own browser or from
-- `advance_tournament_schedules`, which runs as the scheduler with no
-- authenticated user at all, and a plan means the same thing either way.
--
-- The running limit is only checked on the transition *into* a running state.
-- Re-saving a tournament that is already running is not a new run, and would
-- otherwise fail as soon as the limit was exactly reached — including the
-- pause/resume the operator does mid-tournament.

create or replace function enforce_tournament_plan_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan record;
  v_used integer;
  v_entering_play boolean;
begin
  select * into v_plan from account_plan(new.owner_id);

  -- `not exists` rather than `tg_op = 'INSERT'` alone: the app saves through an
  -- upsert, and `insert … on conflict do update` fires BEFORE INSERT triggers
  -- for the proposed row before it discovers the conflict. Without this, an
  -- account at its limit could not edit the tournaments it already has.
  if tg_op = 'INSERT'
    and v_plan.max_tour is not null
    and not exists (select 1 from tournaments where id = new.id)
  then
    select count(*) into v_used from tournaments where owner_id = new.owner_id;
    if v_used >= v_plan.max_tour then
      raise exception
        'Plan limit reached: % allows % tournament(s), and you already have %.',
        v_plan.plan_code, v_plan.max_tour, v_used
        using errcode = 'check_violation';
    end if;
  end if;

  v_entering_play :=
    new.status in ('running', 'paused')
    and (tg_op = 'INSERT' or old.status not in ('running', 'paused'));

  if v_entering_play and v_plan.max_running_tour is not null then
    select count(*) into v_used
    from tournaments
    where owner_id = new.owner_id
      and status in ('running', 'paused')
      and id <> new.id;
    if v_used >= v_plan.max_running_tour then
      raise exception
        'Plan limit reached: % allows % tournament(s) running at once.',
        v_plan.plan_code, v_plan.max_running_tour
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists tournaments_enforce_plan_limits on tournaments;
create trigger tournaments_enforce_plan_limits
  before insert or update of status on tournaments
  for each row execute function enforce_tournament_plan_limits();

-- ---------------------------------------------------------------------------
-- 3. Backgrounds belong to the account that uploaded them
-- ---------------------------------------------------------------------------
--
-- 0007 let any signed-in user list, upload to and delete from the whole `media`
-- bucket, which made every club's backgrounds a shared pool. They are now
-- private to the uploader.
--
-- No new table: `storage.objects` already records who uploaded an object, so
-- ownership is the column that is already there rather than a mirror of the
-- bucket that could drift from it. `owner` is the historical column and
-- `owner_id` its replacement; both are checked so the policies work whichever
-- one this project's storage version populates.
--
-- Objects uploaded before this migration keep working: they stay where they are,
-- still owned by whoever uploaded them, and simply stop being visible to
-- everyone else. Nothing is renamed, because renaming a storage row without
-- moving the object behind it breaks the object.
--
-- The bucket stays Public, so the unauthenticated projector still resolves a
-- background by URL — these policies govern listing, uploading and deleting,
-- which is exactly what "belongs to the user" has to mean here.

create or replace function storage_object_is_own(p_owner uuid, p_owner_id text)
returns boolean
language sql
stable
as $$
  select auth.uid() is not null
    and (p_owner = auth.uid() or p_owner_id = auth.uid()::text);
$$;

-- Counts the caller's own objects without going through the policy below — a
-- policy that queried storage.objects directly would recurse into itself.
-- Argument-free on purpose: `security definer` plus a user id parameter would be
-- a way to ask about somebody else's account.
create or replace function my_background_count()
returns integer
language sql
stable
security definer
set search_path = storage, public
as $$
  select count(*)::integer
  from storage.objects o
  where o.bucket_id = 'media'
    and (o.owner = auth.uid() or o.owner_id = auth.uid()::text);
$$;

-- The caller's own background allowance, for the upload policy. Same reasoning:
-- no parameter, so it can only ever answer for whoever is asking.
create or replace function my_max_background()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select max_background from account_plan(auth.uid());
$$;

grant execute on function my_background_count() to authenticated;
grant execute on function my_max_background() to authenticated;

drop policy if exists "authenticated can list media backgrounds" on storage.objects;
drop policy if exists "authenticated can upload media backgrounds" on storage.objects;
drop policy if exists "authenticated can delete media backgrounds" on storage.objects;
drop policy if exists "media backgrounds are listed by their owner" on storage.objects;
drop policy if exists "media backgrounds are uploaded by their owner" on storage.objects;
drop policy if exists "media backgrounds are replaced by their owner" on storage.objects;
drop policy if exists "media backgrounds are deleted by their owner" on storage.objects;

create policy "media backgrounds are listed by their owner"
on storage.objects for select
to authenticated
using (bucket_id = 'media' and storage_object_is_own(owner, owner_id));

-- The plan's background allowance is enforced here rather than only in the app:
-- the app can refuse politely, but this is what makes the refusal true.
create policy "media backgrounds are uploaded by their owner"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'media'
  and storage_object_is_own(owner, owner_id)
  and (my_max_background() is null or my_background_count() < my_max_background())
);

-- Overwriting an image the account already owns is a replacement, not a new
-- upload, so it is not counted against the allowance.
create policy "media backgrounds are replaced by their owner"
on storage.objects for update
to authenticated
using (bucket_id = 'media' and storage_object_is_own(owner, owner_id))
with check (bucket_id = 'media' and storage_object_is_own(owner, owner_id));

create policy "media backgrounds are deleted by their owner"
on storage.objects for delete
to authenticated
using (bucket_id = 'media' and storage_object_is_own(owner, owner_id));

-- ---------------------------------------------------------------------------
-- 4. Units: two shared defaults, plus whatever an account adds for itself
-- ---------------------------------------------------------------------------
--
-- `currencies` was global reference data with a single primary key on `code`,
-- which is exactly what stops two clubs each having their own "CHIPS". The table
-- gains a surrogate key and an owner: a null owner is one of the shared defaults
-- every account sees, and a non-null one is that account's own unit.
--
-- The tournaments FK goes with it. A foreign key can only point at one column,
-- and `code` is no longer unique on its own — nor should the reference be to a
-- row, since a tournament priced in an account's custom unit must keep reading
-- as that unit even if the account later deletes it. The column is what the
-- tournament is priced in, as text.
--
-- KEYS is dropped from the defaults, per the new rule that every account starts
-- with VND and USD only — but only if nothing is priced in it, since deleting a
-- unit that is in use would silently relabel somebody's tournament.

alter table currencies
  add column if not exists id uuid not null default gen_random_uuid(),
  add column if not exists owner_id uuid references auth.users (id) on delete cascade;

alter table tournaments drop constraint if exists tournaments_currency_fkey;

alter table currencies drop constraint if exists currencies_pkey;
alter table currencies add primary key (id);

alter table currencies drop constraint if exists currencies_code_upper_check;
alter table currencies add constraint currencies_code_upper_check
  check (code = upper(code) and length(code) > 0);

-- One row per code per owner, and one shared row per code. The coalesce is what
-- lets a single index cover both halves — null owners would otherwise never
-- collide with each other, and the shared defaults could be duplicated.
drop index if exists currencies_code_owner_key;
create unique index currencies_code_owner_key
  on currencies (code, (coalesce(owner_id, '00000000-0000-0000-0000-000000000000'::uuid)));

insert into currencies (code, label, sort_order, owner_id) values
  ('VND', 'VND', 1, null),
  ('USD', 'USD', 2, null)
on conflict do nothing;

update currencies set sort_order = 1 where code = 'VND' and owner_id is null;
update currencies set sort_order = 2 where code = 'USD' and owner_id is null;

delete from currencies
where code = 'KEYS'
  and owner_id is null
  and not exists (select 1 from tournaments t where t.currency = 'KEYS');

-- An account may not shadow a shared default: "USD" has to mean the same thing
-- on every screen in the room. Checked here rather than in the unique index,
-- which cannot express "collides with the null-owner row".
create or replace function enforce_currency_code_is_free()
returns trigger
language plpgsql
as $$
begin
  if new.owner_id is not null and exists (
    select 1 from currencies c where c.owner_id is null and c.code = new.code
  ) then
    raise exception '% is already a standard unit.', new.code
      using errcode = 'unique_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists currencies_code_is_free on currencies;
create trigger currencies_code_is_free
  before insert or update of code on currencies
  for each row execute function enforce_currency_code_is_free();

drop policy if exists "currencies_select_all" on currencies;
drop policy if exists "currencies_select_visible" on currencies;
drop policy if exists "currencies_insert_own" on currencies;
drop policy if exists "currencies_update_own" on currencies;
drop policy if exists "currencies_delete_own" on currencies;

create policy "currencies_select_visible" on currencies
  for select using (owner_id is null or owner_id = auth.uid());
create policy "currencies_insert_own" on currencies
  for insert with check (owner_id = auth.uid());
create policy "currencies_update_own" on currencies
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "currencies_delete_own" on currencies
  for delete using (owner_id = auth.uid());

create index if not exists currencies_owner_id_idx on currencies (owner_id);

-- ---------------------------------------------------------------------------
-- 5. Registration is opened by hand, inside a six-hour window
-- ---------------------------------------------------------------------------
--
-- A scheduled registration start was a second instant to keep correct, and it
-- opened the board whether or not anybody was in the room. There is now one
-- configurable instant — when the tournament starts — and the registration
-- countdown is a thing the organiser triggers:
--
--   more than 6 hours out   the countdown cannot be opened at all
--   within 6 hours          the organiser may open it; nothing happens until they do
--   opened                  it counts from that moment to the tournament start
--
-- `registration_opened_at` is that trigger, recorded. It doubles as the start of
-- the progress bar, which is why it is an instant rather than a flag: the
-- countdown a room sees runs from when the doors were actually opened, not from
-- a time somebody typed in yesterday.
--
-- Nothing needs to know which occurrence it belongs to. A stamp older than six
-- hours before the start in play cannot have opened that occurrence, so a weekly
-- tournament's next night starts closed without anything being cleared.

alter table tournaments
  add column if not exists registration_opened_at timestamptz;

alter table tournaments
  drop column if exists registration_start_at,
  drop column if exists registration_time;

-- ---------------------------------------------------------------------------
-- Which occurrence a schedule is on, without a registration time
-- ---------------------------------------------------------------------------
--
-- Same rule as 0012, resolved off the start instead of the opening: the most
-- recent start that has happened, is still within its day, and has outlived the
-- last dismissal — otherwise the next start to come, so a caller can see it is
-- pending and decide whether registration may be opened yet.

drop function if exists tournament_occurrence(
  text, timestamptz, timestamptz, smallint[], text, text, timestamptz, timestamptz);
drop function if exists tournament_occurrence(
  text, timestamptz, smallint[], text, timestamptz, timestamptz);

create function tournament_occurrence(
  p_repeat text,
  p_tournament_start_at timestamptz,
  p_weekdays smallint[],
  p_start_time text,
  p_dismissed_at timestamptz,
  p_now timestamptz
)
returns table (starts_at timestamptz)
language plpgsql
immutable
as $$
declare
  v_offset constant interval := interval '7 hours';
  v_lifetime constant interval := interval '24 hours';
  v_today date;
  v_day date;
  v_starts timestamptz;
  v_back integer;
  v_ahead integer;
begin
  if coalesce(p_repeat, 'once') <> 'weekly' then
    return query select p_tournament_start_at;
    return;
  end if;

  if p_weekdays is null or array_length(p_weekdays, 1) is null or p_start_time is null then
    return query select null::timestamptz;
    return;
  end if;

  v_today := ((p_now + v_offset) at time zone 'UTC')::date;

  -- Today first, then backwards.
  for v_back in 0..7 loop
    v_day := v_today - v_back;
    if extract(dow from v_day)::smallint = any (p_weekdays) then
      v_starts := ((v_day + p_start_time::time) - v_offset) at time zone 'UTC';
      if v_starts <= p_now then
        exit when p_now - v_starts >= v_lifetime;
        if p_dismissed_at is null or v_starts > p_dismissed_at then
          return query select v_starts;
          return;
        end if;
      end if;
    end if;
  end loop;

  -- Nothing current: report the next one so it reads as pending.
  for v_ahead in 0..7 loop
    v_day := v_today + v_ahead;
    if extract(dow from v_day)::smallint = any (p_weekdays) then
      v_starts := ((v_day + p_start_time::time) - v_offset) at time zone 'UTC';
      if v_starts > p_now and (p_dismissed_at is null or v_starts > p_dismissed_at) then
        return query select v_starts;
        return;
      end if;
    end if;
  end loop;

  return query select null::timestamptz;
end;
$$;

-- ---------------------------------------------------------------------------
-- The writes a schedule still implies
-- ---------------------------------------------------------------------------
--
-- The registration branch is gone with the column: opening the board is now an
-- act, and an act with nobody there to perform it does not happen. What is left
-- is the half that genuinely cannot wait for a browser — a tournament starting
-- at its appointed minute, and one whose last level has run out.
--
-- 'registering' is still scanned at the front, because a tournament whose
-- registration the operator opened by hand must still start itself on time.

create or replace function advance_tournament_schedules()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_starts_at timestamptz;
  v_changed integer := 0;
begin
  for v_row in
    select * from tournaments
    where status in ('setup', 'registering')
      and (schedule_repeat = 'weekly' or tournament_start_at is not null)
  loop
    select o.starts_at into v_starts_at from tournament_occurrence(
      v_row.schedule_repeat,
      v_row.tournament_start_at,
      v_row.schedule_weekdays,
      v_row.start_time,
      v_row.schedule_dismissed_at,
      now()
    ) o;

    if v_starts_at is not null and now() >= v_starts_at then
      -- Each tournament starts in its own sub-transaction. Starting one can be
      -- refused — the account's plan may only allow so many running at once —
      -- and one account at its limit must not stop the sweep for everybody
      -- else. The refusal is left for the operator to meet on the screen.
      begin
        insert into clock_states (
          tournament_id, owner_id, current_level_index, level_started_at_epoch_ms
        )
        values (
          v_row.id,
          v_row.owner_id,
          0,
          (extract(epoch from v_starts_at) * 1000)::bigint
        )
        on conflict (tournament_id) do nothing;

        update tournaments set status = 'running' where id = v_row.id;
        v_changed := v_changed + 1;
      exception
        when others then
          raise warning 'Could not start tournament %: %', v_row.id, sqlerrm;
      end;
    end if;
  end loop;

  -- Back of the lifecycle: the last level has run out. Applies to manually
  -- started tournaments too — the status should be true whoever started it.
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

revoke all on function advance_tournament_schedules() from public;

-- ---------------------------------------------------------------------------
-- The projector's view of a tournament
-- ---------------------------------------------------------------------------
--
-- Re-declared for the column swap. The TV is the screen the registration
-- countdown is for, so `registration_opened_at` has to be here or opening the
-- board changes nothing in the room.

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
    t.created_at, t.updated_at
  from tournaments t
  where t.join_code = upper(p_join_code);
$$;

grant execute on function get_tournament_by_join_code(text) to anon, authenticated;
