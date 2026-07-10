# poker-clock — Supabase setup guide

Step-by-step guide to stand up the Supabase backend this app talks to. No Supabase CLI required — everything is done through the dashboard and the SQL editor. See `SCHEMA.md` in this folder for what the resulting schema looks like and why it's shaped that way.

There is no public sign-up in this app — accounts are created by hand in the Supabase dashboard (step 3). Anyone who wants access has to be given one by whoever runs the project.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account).
2. **New project** → pick an organization, name it (e.g. `poker-clock`), set a database password (save it somewhere — you won't need it for this app, but you'll need it if you ever connect a Postgres client directly), pick a region close to you.
3. Wait for provisioning to finish (~1–2 minutes).

## 2. Run the migrations

1. In the project dashboard, open **SQL Editor** (left sidebar).
2. Click **New query**.
3. Open `supabase/migrations/0001_init.sql` from this repo, copy its entire contents, paste into the query editor, and click **Run**.
   - This creates `tournaments` (including the `entrant_count`/`eliminated_count`/`rebuy_count`/`add_on_count` counters — there is no `players`/`registrations` table in this app, see `SCHEMA.md`) and `clock_states`, enables Row Level Security, adds the owner-scoped policies, and adds `clock_states` to the Realtime publication.
4. Open a **New query** again, copy `supabase/migrations/0002_currencies.sql`, paste, and click **Run**.
   - This creates the `currencies` lookup table (seeded with USD/VND/KEYS), and switches `tournaments.currency` from a hardcoded list to a foreign key against it — so adding a new currency later is a SQL insert, not a code change.
5. Open a **New query** again, copy `supabase/migrations/0003_public_projector.sql`, paste, and click **Run**.
   - This adds a short `join_code` to each tournament and makes the projector view (`/p/:join_code`) work without signing in — see `SCHEMA.md`'s "Public projector access" section for exactly what's exposed and why.
6. Open a **New query** again, copy `supabase/migrations/0004_widen_money_columns.sql`, paste, and click **Run**.
   - Widens `buy_in_cents`/`fee_cents`/`bounty_amount_cents`/`guaranteed_prize_pool_cents` from `integer` to `bigint`. Every amount is stored ×100 (hundredths), and for a subunit-less currency like VND a realistic guarantee (e.g. 200,000,000) becomes 20,000,000,000 — past a 4-byte `integer`'s ~2.147 billion ceiling, so saving would fail outright with an "out of range" error before this ran.
7. Open a **New query** again, copy `supabase/migrations/0005_payout_unit_and_background.sql`, paste, and click **Run**.
   - Adds `payout_unit` (percentage vs. fixed-amount payouts) and `projector_background_id` (which uploaded Storage background a tournament uses) to `tournaments`, and re-declares `get_tournament_by_join_code` to return the two new columns.
8. Open a **New query** again, copy `supabase/migrations/0006_rebuy_addon_price_drop_bounty.sql`, paste, and click **Run**.
   - Drops `bounty_amount_cents` (the bounty feature is gone) and adds `rebuy_price_cents`/`add_on_price_cents` so a rebuy and an add-on can each have their own price instead of always assuming the buy-in amount; re-declares `get_tournament_by_join_code` to match.
9. Open a **New query** again, copy `supabase/migrations/0007_media_bucket_policies.sql`, paste, and click **Run**.
   - Adds the storage RLS policies that let signed-in users **list** and **upload** projector backgrounds in the `media` bucket (step 4). A bucket being Public only makes objects downloadable by URL — listing/uploading still go through RLS, so without this the Settings page shows an empty list even though images exist. (You can also do this from the dashboard's Storage → Policies UI; the SQL just does the same thing reproducibly.)
10. Run them **in order** (0001 through 0007). If you ever add another schema change, add a new `0008_...` file rather than editing any of these once they've been run against a real project.

You can confirm it worked in **Table Editor** — you should see `tournaments` (with `eliminated_count`, `join_code`, `payout_unit`, and `projector_background_id` columns), `clock_states`, and `currencies` (with 3 seeded rows). Under **Database → Functions** you should see `get_tournament_by_join_code`.

## 3. Create user accounts (this is how you log in — there is no sign-up screen)

The app only has a sign-in form. To create the first account (or any account after that):

1. **Authentication** → **Users** (left sidebar).
2. **Add user** → **Create new user**.
3. Enter an email and a password.
4. Check **Auto Confirm User** — without this the account is created but can't sign in until it's confirmed, and there's nothing in this app to do that confirmation for you.
5. Click **Create user**.

Hand the email/password to whoever needs access, out of band (Slack, in person, whatever). That's the entire "invite" flow — repeat for every new person. There's no self-serve path and no invite email sent automatically.

Each Supabase Auth user is a fully separate account: their tournaments are only ever visible to them (Row Level Security scopes everything to `owner_id = auth.uid()`), there's no shared data between users.

## 4. Create the `media` Storage bucket

No migration creates the bucket itself — like user accounts above, it's made by hand (the RLS policies for it *are* a migration, `0007`, run in step 9):

1. **Storage** (left sidebar) → **New bucket**.
2. Name it exactly `media`, and toggle **Public bucket** on (the unauthenticated `/p/:join_code` projector view needs to render a background by URL, and public buckets serve objects without an RLS check).
3. Inside it, create a folder named `background` — projector background images live there (the app uploads to and lists that folder; the bucket can hold other media alongside it).

This backs the "Projector backgrounds" section on Settings — uploaded images are the only backgrounds the app offers, selectable from the same Setup Wizard picker. Listing and uploading them requires the RLS policies added in step 9; a Public bucket alone is **not** enough (Public only affects direct downloads, not listing).

## 5. Enable Realtime on `clock_states` (should already be on)

The `0001_init.sql` migration ends with `alter publication supabase_realtime add table clock_states;`, which is the same thing the dashboard toggle does — so this should already be enabled. To double check:

1. **Database** → **Replication**.
2. Find `clock_states` in the table list and confirm it's toggled **on**.

This is what lets the Control screen (writer) and Projector screen (reader) sync the live countdown across different devices.

## 6. Get your API credentials

1. **Settings** (gear icon) → **API**.
2. Copy the **Project URL** (looks like `https://xxxxxxxxxxxx.supabase.co`).
3. Copy the **anon / public** key (under Project API keys — **not** the `service_role` key, that one must never end up in frontend code).

## 7. Configure the app

From the `poker-clock/` folder:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
```

`.env.local` is already covered by `.gitignore` (Vite's default `*.local` pattern) — it will not be committed.

## 8. Run it

```bash
npm install
npm run dev
```

Open the printed local URL (Vite's default is `http://localhost:5173`):

1. Sign in with the email/password you created in step 3.
2. Create a tournament, open **Control**, hit **Start Tournament** — you should see the clock running.
3. Click the projector icon in Control's header — it copies a short link (`/p/XXXXX`) and shows the code in a toast. Open that link in a second tab, a different browser, or an actual TV — no sign-in required, it should mirror the same live countdown via Supabase Realtime.

## Troubleshooting

- **"Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY" error on startup** — `.env.local` isn't being picked up. Confirm the file is named exactly `.env.local` (not `.env.local.txt` or similar) and restart `npm run dev` (Vite only reads env files at startup).
- **"Invalid login credentials" for a user you just created** — check you ticked **Auto Confirm User** in step 3; an unconfirmed user exists in the table but can't sign in.
- **Rows never appear / silently fail to save** — almost always Row Level Security: every table's policies check `owner_id = auth.uid()`, and `owner_id` defaults to `auth.uid()` on insert, so this should just work as long as you're signed in. If you ever query the tables directly with the `service_role` key or via the SQL editor, remember RLS doesn't apply to a query run as the Postgres superuser, so a `select *` there succeeding doesn't guarantee the app's anon-key requests will.
- **Projector doesn't update when Control changes** — check step 5 (Realtime replication on `clock_states`), and check the browser console for a Realtime connection error. This matters even more for the public `/p/:join_code` view than for the old authenticated one, since Realtime enforces RLS on `clock_states` for anonymous connections too — if `0003_public_projector.sql` didn't fully apply, the public policy allowing anon reads won't exist and the projector will silently never update.
- **"No tournament found for this code"** — either the code was mistyped, or `0003_public_projector.sql` didn't run (check `get_tournament_by_join_code` exists under Database → Functions, and that it's granted to `anon`/`authenticated`).
- **Saving a tournament fails with something like "out of range for type integer" / "value too long"** — `0004_widen_money_columns.sql` hasn't run yet. Large VND-scale amounts (buy-in, fee, bounty, guarantee) overflow the old `integer` columns once the app multiplies them by 100.
- **Settings page shows no backgrounds even though you uploaded some** — the images exist (their public URLs even work) but the list is empty. This is almost always the storage RLS policies from step 9 (`0007`) not being applied: a Public bucket makes objects *downloadable* but does **not** grant permission to *list* them, so `.list()` returns an empty array with no error. Confirm the `media` bucket has `authenticated` `select` + `insert` policies (Storage → Policies, or re-run `0007`). Also check the bucket is named exactly `media` and the images are in a `background/` folder inside it.
- **Projector view doesn't show a background** — check the `media` bucket is actually marked Public; a private bucket needs a signed URL, which this app doesn't use.
