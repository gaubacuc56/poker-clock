-- poker-clock: widen money columns from integer to bigint
--
-- Every money amount is stored as hundredths (buyIn/fee/bounty/guarantee are
-- all `value * 100` before hitting the DB — the same "smallest unit"
-- convention Stripe etc. use). That's fine for a currency like USD, but VND
-- has no subunit at all, so a realistic guarantee (e.g. 200,000,000 VND)
-- becomes 20,000,000,000 once multiplied by 100 — past the ~2.147 billion
-- ceiling of a 4-byte `integer` column, so the insert/update was rejected
-- outright by Postgres ("out of range for type integer"). `bigint` (up to
-- ~9.2 * 10^18) has enormous headroom for this; the JS side already just
-- uses plain `number`, which safely covers this range too.

alter table tournaments
  alter column buy_in_cents type bigint,
  alter column fee_cents type bigint,
  alter column bounty_amount_cents type bigint,
  alter column guaranteed_prize_pool_cents type bigint;
