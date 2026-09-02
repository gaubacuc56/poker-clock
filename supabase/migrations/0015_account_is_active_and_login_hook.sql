-- poker-clock: an account switch, and a login that refuses to issue a token
--
-- Two parts, one purpose: sign-in must fail for an account that is not
-- entitled to be in, and it must fail at the API rather than in the app.
--
--   1. profiles.is_active — the switch, independent of any date
--   2. an auth hook that refuses token issuance when the account is not active
--
-- Nothing is mirrored and nothing is scheduled. The hook is evaluated by GoTrue
-- on every sign-in and every token refresh, so it reads today's answer from
-- these tables — a plan that runs out of days at midnight takes effect at
-- midnight with nobody touching a row.

-- ---------------------------------------------------------------------------
-- 1. The switch
-- ---------------------------------------------------------------------------
--
-- Not null and default true: an account that nobody has ever suspended is in,
-- and existing rows are all in. Null would be a third state nobody means.
--
-- Separate from the dates because it answers a different question. `plan_end`
-- is when the arrangement runs out; this is somebody deciding the account may
-- not be used, whatever its dates say.

alter table profiles
  add column if not exists is_active boolean not null default true;

-- ---------------------------------------------------------------------------
-- The one reading of "may this account be used"
-- ---------------------------------------------------------------------------
--
-- `account_plan` already answered it from the dates, and every enforcement
-- point in 0013 and 0014 asks it. The switch folds into the same answer, so
-- adding it changes nothing else: the limit triggers, the storage policy, the
-- projector's start allowance and the app's own `isAccountLocked` all follow.
--
-- Re-declared rather than replaced: the return shape is unchanged, but the body
-- now reads one more column.

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
    coalesce(v_profile.is_active, true)
    and v_profile.plan_code is not null
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

-- ---------------------------------------------------------------------------
-- 2. The login refusal
-- ---------------------------------------------------------------------------
--
-- A Supabase custom-access-token hook: GoTrue calls it every time it issues a
-- token, hands it the event, and takes back either the event (allow) or an
-- error (refuse). Refusing here is what makes `signInWithPassword` fail — and,
-- because a refresh is also an issuance, what ends a session that was already
-- open at its next refresh.
--
-- The message is a code, not a sentence. The app owns the wording
-- (`ACCOUNT_LOCKED_MESSAGE` in src/domain/rules/accountAccess.ts) and matches on
-- this; keeping a second copy of the sentence here would be a second copy to
-- keep in step.
--
-- The exception handler is the important line. This function stands between
-- every account and its token, so anything unexpected — a renamed column, a
-- missing row — must let the sign-in through rather than lock out every
-- organiser at once. Same rule as the app: an answer we could not read is not a
-- refusal.

create or replace function restrict_inactive_accounts(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_active boolean;
begin
  select p.is_active into v_active
  from account_plan((event ->> 'user_id')::uuid) p;

  if coalesce(v_active, true) then
    return event;
  end if;

  return jsonb_build_object(
    'error',
    jsonb_build_object('http_code', 403, 'message', 'account_inactive')
  );
exception
  when others then
    return event;
end;
$$;

-- Only GoTrue may call it, and it must be able to reach the schema it lives in.
grant usage on schema public to supabase_auth_admin;
grant execute on function restrict_inactive_accounts(jsonb) to supabase_auth_admin;
revoke execute on function restrict_inactive_accounts(jsonb) from public, anon, authenticated;
