-- poker-clock: currency units become database-controlled, not a hardcoded
-- CHECK constraint / TS union — new units can be added with a SQL insert,
-- no code change. Currency only matters for prize pool / payout display;
-- buy-in and fee are shown as plain numbers in the app regardless of it.

create table if not exists currencies (
  code text primary key,
  label text not null,
  sort_order integer not null default 0
);

insert into currencies (code, label, sort_order) values
  ('USD', 'USD', 1),
  ('VND', 'VND', 2),
  ('KEYS', 'KEYS', 3)
on conflict (code) do nothing;

alter table currencies enable row level security;

-- Shared reference data, same for every organizer — managed only via the
-- dashboard/SQL editor, never written to by the app itself.
create policy "currencies_select_all" on currencies
  for select using (true);

-- Replace the hardcoded ('USD','VND','KEYS') CHECK with a real FK so the
-- allowed set lives in `currencies`, not in this migration.
alter table tournaments
  drop constraint if exists tournaments_currency_check;

alter table tournaments
  add constraint tournaments_currency_fkey
    foreign key (currency) references currencies (code);
