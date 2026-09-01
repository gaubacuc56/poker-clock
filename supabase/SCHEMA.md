# poker-clock — Supabase schema

Entity-relationship diagram for every migration in `migrations/`, `0001_init.sql` through `0013_plans_units_ownership_and_registration_trigger.sql`. Keep this file in sync whenever a migration changes.

```mermaid
erDiagram
    auth_users ||--o{ tournaments  : owns
    auth_users ||--o{ clock_states : owns
    auth_users ||--|| profiles     : "has account row"
    auth_users ||--o{ currencies   : "may own custom units"
    plans       ||--o{ profiles    : "entitles"
    tournaments ||--|| clock_states : "has live clock"

    auth_users {
        uuid id PK "Supabase-managed, not ours"
    }

    plans {
        text plan_code PK "BASIC, MODERATOR — uppercase"
        int max_tour "nullable = unlimited"
        int max_running_tour "nullable = unlimited"
        int max_background "nullable = unlimited"
    }

    profiles {
        uuid id PK "also FK to auth.users"
        text plan_code FK "nullable — absent is treated as BASIC"
        date plan_start "nullable"
        date plan_end "nullable"
    }

    currencies {
        uuid id PK "0013 — code is no longer unique on its own"
        text code "e.g. USD, VND — uppercase"
        text label
        int sort_order
        uuid owner_id FK "null = a standard unit everyone sees"
    }

    tournaments {
        uuid id PK
        uuid owner_id FK
        text name
        text status "setup|registering|running|paused|final_table|complete"
        text currency "0013 — plain text, no longer a FK: `code` is not unique once accounts own units"
        text join_code UK "short public code, e.g. K7QX2 — /p/:join_code"
        bigint buy_in_cents
        bigint fee_cents
        bigint guaranteed_prize_pool_cents "nullable, IS the prize pool when set — no entrant math"
        int starting_stack
        int max_players_per_table
        int min_entrants "nullable"
        int max_entrants "nullable"
        int entrant_count "buy-ins, admin-controlled counter"
        int eliminated_count "admin-controlled counter"
        int rebuy_count "admin-controlled counter"
        int add_on_count "admin-controlled counter"
        int late_reg_level "closes late reg, and the level the Reg End line names"
        bool allow_rebuy
        bool allow_add_on
        bigint rebuy_price_cents "nullable, falls back to buy_in_cents"
        bigint add_on_price_cents "nullable, falls back to buy_in_cents"
        jsonb blind_levels "BlindLevel[]"
        jsonb payout_tiers "PayoutTier[] — { position, value, note? }"
        jsonb sounds "SoundSettings"
        text schedule_repeat "0012 — once|weekly, decides which half below is read"
        timestamptz tournament_start_at "nullable, 0010 — once: clock starts here"
        smallint_arr schedule_weekdays "0012 — weekly: 0=Sun..6=Sat, UTC+7"
        text start_time "nullable, 0012 — weekly: HH:mm UTC+7"
        timestamptz schedule_dismissed_at "nullable, 0012 — Stop dismissed this night"
        timestamptz registration_opened_at "nullable, 0013 — the operator opened the doors"
        text reg_end_time "nullable, 0011 — HH:mm wall clock, no date"
        timestamptz created_at
        timestamptz updated_at
    }

    clock_states {
        uuid tournament_id PK "also FK to tournaments"
        uuid owner_id FK
        int current_level_index
        bigint level_started_at_epoch_ms
        bigint paused_accumulated_ms
        bool is_paused
        bigint paused_at_epoch_ms "nullable"
        bool is_muted
        timestamptz updated_at
    }
```

## Reading the diagram

- **`auth_users`** is Supabase's built-in `auth.users` table (not created by our migration) — both `tournaments` and `clock_states` have an `owner_id` pointing at it, `on delete cascade`. This is the whole multi-tenancy model: nothing is shared between organizers, and RLS on those two is just `owner_id = auth.uid()` for select/insert/update/delete.
- **`currencies`** holds two kinds of row (`0013`). A null `owner_id` is a standard unit — VND and USD, the same two for every account. A non-null one is a unit an account created for itself, invisible to everyone else. It only affects prize pool/payout display — buy-in and fee are shown as plain numbers regardless of unit.
- **`plans`** and **`profiles`** are the account's entitlements (`0013`): a plan is a named set of allowances, and a profile says which plan an account is on and between which dates. Both are read-only to the app — an account that could write its own profile could grant itself a plan.
- **`tournaments`** is the only real per-user entity. There's no per-player roster: the app only ever needs *how many* — `entrant_count` (buy-ins), `eliminated_count`, `rebuy_count`, `add_on_count` — not *who*. All four are plain counters the admin increments/decrements live from the app, no join tables involved. Blind levels and payout tiers are likewise `jsonb` columns directly on the row rather than separate tables, since a tournament always owns exactly one of each.
- **`clock_states`** is a strict 1:1 with `tournaments` (`tournament_id` is both its primary key and its foreign key) — one live countdown row per tournament, added to the `supabase_realtime` publication so Control (writer) and Projector (reader) can run on different devices. The row's lifecycle mirrors Start/Stop, not just Start/Pause: **Start** upserts it, **Pause/Resume/level changes** update it, and **Stop** deletes it outright (the pre-existing `clock_states_delete_own` policy already allows this — no migration needed). Deleting it is what makes Stop mean "start over," not "resume where paused" — and it's also what the Control screen reads back via `fetch()` on mount, so refreshing or reopening the Control tab while a tournament is running/paused resumes the real remote clock instead of losing it locally.

## No per-player tables, on purpose

There is deliberately no `players`/`registrations` table — the app never surfaces individual player identity anywhere, only aggregate counts. Total-chips-in-play math assumes every rebuy/add-on grants the starting stack; prize pool math uses `rebuy_price_cents`/`add_on_price_cents` for their cost (falling back to `buy_in_cents` when unset — see `0006_rebuy_addon_price_drop_bounty.sql`).

## Public projector access (`0003_public_projector.sql`)

Typing a full UUID into a TV remote is unusable, so the projector view is reached by a short `join_code` (5 characters, unambiguous alphabet — no `0/O/1/I/L`) at `/p/:join_code`, and that route deliberately doesn't require signing in. Two different exposure mechanisms, on purpose:

- **`tournaments` stays fully owner-scoped** — RLS is unchanged. The public route instead calls `get_tournament_by_join_code(text)`, a `SECURITY DEFINER` SQL function that returns every tournament column *except* `owner_id`, and only for the one row matching the exact code. It can't be used to list or scan tournaments — there's no "get all" version, only exact lookup.
- **`clock_states` gets a real public `select using (true)` RLS policy.** Its contents (level index, pause state, timestamps) are low-sensitivity, and — importantly — Supabase Realtime enforces the table's RLS on `postgres_changes` subscriptions. An anonymous viewer can't receive *live* countdown updates at all unless the table itself is selectable by the `anon` role; there's no way to scope a Realtime subscription to "only the row matching a code you know," so this one is intentionally open to everyone rather than gated by a function like `tournaments` is.

The app polls `get_tournament_by_join_code` every few seconds from the projector page to keep slower-changing fields (player counts, prize pool) fresh, while the countdown itself updates instantly via the `clock_states` Realtime subscription.

## Money columns are `bigint`, not `integer` (`0004_widen_money_columns.sql`)

Every amount is stored ×100 (hundredths — same convention as Stripe's "smallest unit" cents). That's harmless for USD, but VND has no subunit, so a real guarantee like 200,000,000 VND becomes 20,000,000,000 once multiplied by 100 — past a 4-byte `integer`'s ~2.147 billion ceiling. Postgres rejected the write outright with an out-of-range error. `bigint` (up to ~9.2 × 10^18) has essentially unlimited headroom for this; the app's TS side was never the problem since it just uses a plain `number`.

Related: `guaranteedPrizePool` is a straight override, not a floor — `domain/rules/prizePool.ts`'s `calculatePrizePoolForTournament` returns it as-is whenever it's set, with zero entrant/buy-in math involved. It only computes `entries × buyIn` when there's no guarantee at all.

## Bounty removed, rebuy/add-on get their own price (`0006_rebuy_addon_price_drop_bounty.sql`)

The bounty feature (a flat amount per knockout) was removed entirely, including its `bounty_amount_cents` column. In its place, a rebuy and an add-on can each have their own price (`rebuy_price_cents`/`add_on_price_cents`) instead of always being assumed to cost `buy_in_cents` — set once at tournament setup, `null` meaning "not set, use `buy_in_cents`" for tournaments created before this shipped.

## Projector backgrounds (`media` bucket, `background/` folder — see `SETUP.md` step 4)

`tournaments.projector_background_id` (added in `0005`) used to only ever reference an id in a bundled config file — that migration's comment says as much. That bundled list is gone; projector backgrounds are now objects in a `background/` folder inside a public Storage bucket named `media` (the bucket is created by hand via the dashboard — same as user accounts — while its RLS policies are migration `0007`). Any signed-in user can upload images from the Settings page. `projector_background_id` holds the object's full in-bucket path (e.g. `background/uuid-name.jpg`), resolved to a URL at render time (`resolveBackgroundPath` in `src/infrastructure/supabase/SupabaseBackgroundRepository.ts`).

The bucket is Public so the unauthenticated `/p/:join_code` projector view can render a background by URL. But Public only governs direct object downloads — **listing** and **uploading** always go through RLS on `storage.objects`, so `0007` added `authenticated`-role `select`/`insert` policies scoped to the `media` bucket. Without them the Settings page's `list()` returns an empty array (no error), even though the objects exist and their public URLs resolve.

`0013` narrows those policies from "any signed-in user" to "the account that uploaded it" — see below.

## Not shown

## Scheduled start (`0010_tournament_schedule.sql`, amended by `0013`)

`tournament_start_at` is nullable — an unscheduled tournament, the norm, has none and is started by hand exactly as before. It is a real `timestamptz` column rather than a key in the `projector` jsonb bag because the clock starts itself off it: the value has to be something Postgres can type-check and compare, not presentation.

`0010` shipped a second instant beside it, `registration_start_at`; `0013` removes it — see "Registration is opened by hand" below.

Instants are stored in UTC; the organiser picks them in UTC+7 (`src/domain/rules/tournamentSchedule.ts` owns that conversion, and ICT's lack of DST is why a fixed offset is the whole rule).

The column is exposed through `get_tournament_by_join_code` — the TV is the screen that has to show the countdown, and anything missing from that function is invisible to it.

## Registration close announcement (`0011_registration_end.sql`)

The projector prints `Reg End: Level 8 ( 20h30 )` under the buy-in/re-buy/stack line. Only the time is new here — the level is `late_reg_level`, which already exists and already means exactly this. Deliberately not a second column: the sign on the TV and the rule the app enforces (`isLateRegClosed`) are one number and cannot drift apart. `late_reg_level` of 0 announces nothing.

`reg_end_time` is a bare time of day, stored as text in `HH:mm` rather than as a `time`: it's the exact string `<input type="time">` produces, and `time`'s `HH:MM:SS` would need trimming on every read for precision nobody enters. There is deliberately no date — the room reads the time off the wall, and a tournament running behind simply reaches the level later than the sign says.

Either half may stand alone: level with no time reads `Reg End: Level 8`, time with no level reads `Reg End: 20h30`. `0011` re-declares `get_tournament_by_join_code` to expose the column, since the projector is the only screen this line is for.

Row-level security policies, indexes, and the `set_updated_at` trigger are omitted here for readability — see the migration files themselves for those.

## Repeating schedules, run by the database (`0012_weekly_schedule_and_cron.sql`)

Two changes that only make sense together.

**Repeating.** A dated schedule describes one evening, so stopping the run clears it and the organiser enters tomorrow's date tomorrow — a club that runs every Friday was doing that weekly. `schedule_repeat` decides which half of the schedule is read: `once` uses `tournament_start_at`; `weekly` uses `schedule_weekdays` (0 = Sunday … 6 = Saturday, UTC+7) plus `start_time` (`HH:mm`, UTC+7). Times of day are text, matching `reg_end_time` and the string `<input type="time">` produces.

Nothing outside `src/domain/rules/tournamentSchedule.ts` knows there are two shapes: `scheduleOccurrence` resolves either to the start instant of the occurrence in play, and the phase, the registration countdown and the derived clock all read that. A weekly occurrence is current from its start for 24 hours — long enough for a night running past midnight, over well before the next week, so the TV announces the coming night rather than sitting on a stale result.

`schedule_dismissed_at` is the Dismiss half of an alarm. Stop on a weekly tournament records the instant instead of clearing the days, and occurrences that started at or before it are skipped — the next day on the list still fires. Turning the arrangement off means clearing `schedule_weekdays` in setup. Stop on a dated schedule still clears the two instants, since that schedule described one evening.

**Run by the database.** Every scheduled transition used to need a browser. The screens *derive* the registration board and the clock from the schedule, so a TV that is on shows the right thing at the right second — but the `status` a dashboard reads, the `clock_states` row a run needs, and the eventual `finished` were only ever written by an open control screen. A club that sets a Friday alarm and closes the app is entitled to have Friday happen.

`advance_tournament_schedules()` does those writes and `pg_cron` calls it every minute, covering both ends of the lifecycle:

| At | Write |
|---|---|
| Start time | `status → running`, insert `clock_states` with `level_started_at_epoch_ms` = the scheduled instant |
| Last level runs out | `status → finished` |

(`0012` also had a "registration time → `status: setup → registering`" row. `0013` removes it: opening the doors is an act, and an act with nobody there to perform it does not happen.)

It is idempotent: every branch is guarded on the status it changes and the clock row is an `on conflict do nothing` insert, so repeated runs cost nothing. The start instant is used rather than `now()`, so a tournament the job reaches late is late-into-itself, not starting fresh — the same rule the client uses when adopting a derived clock. Finishing applies to manually started tournaments too, since the status should be true whoever started it, and it changes only the status: the clock row is left alone so the result keeps showing until the admin stops the tournament. The function is `security definer` and writes across owners, so it is revoked from `public` — only the scheduler may call it.

Stop stays authoritative over the job. It deletes the clock row, clears `registration_opened_at`, and either clears a dated schedule or records `schedule_dismissed_at`, so `tournament_occurrence` stops returning an evening that has started and there is nothing left to re-insert.

A minute is the job's resolution because a minute is the resolution a schedule is set at. It is only the bookkeeping cadence — the room still sees the countdown update every 250ms.

**Known duplication.** `tournament_occurrence()` restates `scheduleOccurrence`, and `tournament_clock_finished()` restates `isClockFinished` from `src/domain/rules/blindProgression.ts`. Both are deliberate — the screens cannot ask the database every 250ms, and a status that only updates when somebody is looking is not a status — and both can drift, so change each pair together. The schedule half is meant to be collapsed by having the API return the resolved instants, at which point the client stops computing them at all.

## Plans and profiles (`0013`)

An organiser is now an account with entitlements, not just a row owner.

`plans` is reference data — a named set of allowances (`BASIC`, `MODERATOR`), readable by everyone and writable only from the dashboard. A null allowance means *no limit*, which is a different thing from zero; that distinction is why all three are nullable rather than defaulted to some very large number.

`profiles` is one row per `auth.users` row, created by a trigger on insert and backfilled for accounts that already existed. It carries the three new user columns — `plan_code`, `plan_start`, `plan_end`, all nullable, each absence meaning something different: no plan named, always been in force, does not expire. It is **select-only** to its owner; an account that could write its own profile could grant itself a plan.

`account_plan(uuid)` is the single answer to "what is this account allowed to do". A plan that has not started or has already ended does not apply, and the account falls back to `BASIC` rather than to nothing — an expired subscription degrades to the free tier instead of locking the organiser out of tournaments they already have. Everything else asks it:

| Allowance | Enforced by | Counted as |
|---|---|---|
| `max_tour` | `tournaments_enforce_plan_limits` trigger, on insert | rows owned |
| `max_running_tour` | same trigger, on the transition *into* `running`/`paused` | rows in play |
| `max_background` | the `media` insert policy, via `my_max_background()` / `my_background_count()` | objects owned |

The running limit is only checked on the way *into* a running state. Re-saving a tournament that is already running is not a new run, and a stricter check would fail on the pause/resume an operator does mid-tournament. Both counts are taken against `new.owner_id` rather than `auth.uid()`, because the same write arrives from a browser and from `advance_tournament_schedules`, which runs as the scheduler with no authenticated user at all.

`src/domain/rules/planLimits.ts` restates the same refusals in the client. That is the polite half only — it refuses before the round trip with a sentence naming the plan and the number, and treats an unknown plan as "allow it and let the database decide".

## Backgrounds belong to the account that uploaded them (`0013`)

`0007` let any signed-in user list, upload to and delete from the whole `media` bucket, which made every club's backgrounds a shared pool. `0013` scopes all three to `storage.objects.owner`.

No new table: storage already records who uploaded an object, so ownership is the column that is already there rather than a mirror of the bucket that could drift from it. Both `owner` and its replacement `owner_id` are checked, so the policies work whichever one this project's storage version populates.

Objects uploaded before the migration are left exactly where they are — still owned by whoever uploaded them, simply no longer visible to anybody else. Nothing is renamed, because renaming a `storage.objects` row without moving the object behind it breaks the object. What *is* new is that uploads are named `background/<owner-id>__<filename>`, so two accounts uploading `felt.jpg` no longer collide in a bucket they can't see each other in; `SupabaseBackgroundRepository` strips that prefix for display.

## Units are per-account (`0013`)

`currencies` had a single primary key on `code`, which is exactly what stops two clubs each having their own `CHIPS`. It gains a surrogate `id` and an `owner_id`: null is one of the shared defaults every account sees, non-null is that account's own unit. A unique index on `(code, coalesce(owner_id, <nil uuid>))` covers both halves at once — null owners would otherwise never collide with each other, and the shared defaults could be duplicated.

An account may not shadow a standard unit. That is a trigger rather than an index, because "collides with the null-owner row" isn't something a unique index can express.

`tournaments.currency` loses its foreign key with the change. A key can only point at one column and `code` is no longer unique on its own — nor should the reference be to a row, since a tournament priced in a custom unit must keep reading as that unit even after the account deletes it. The column is what the tournament is priced in, as text.

The standard set is now VND and USD. `KEYS` is dropped, but only when nothing is priced in it: deleting a unit in use would silently relabel somebody's tournament.

## Registration is opened by hand (`0013`)

A scheduled registration start was a second instant to keep correct, and it opened the board whether or not anybody was in the room. `registration_start_at` and `registration_time` are both dropped. There is one configurable instant — when the tournament starts — and the countdown is a thing the organiser triggers:

| When | What is offered |
|---|---|
| More than 6 hours before the start | Nothing; the countdown cannot be opened |
| Within 6 hours | The Control screen offers **Open registration** |
| Opened | The board counts from that moment to the start |

`registration_opened_at` is that trigger, recorded. It is an instant rather than a flag because it is also where the progress bar starts: the room's countdown runs from when the doors were actually opened, not from a time typed in yesterday — so opening it late makes the bar shorter, not fuller.

Nothing needs to know which occurrence a stamp belongs to. One older than six hours before the start in play cannot have opened that occurrence, so a weekly tournament's next night begins closed without anything being cleared. Stop clears it anyway, since the run it belonged to is over.

The lead time lives in `REGISTRATION_LEAD_HOURS` in `src/domain/rules/tournamentSchedule.ts`. The database has no opinion on it — it is a rule about what the operator may do, and the operator is always on a screen — so unlike the schedule itself there is no second copy to drift.
