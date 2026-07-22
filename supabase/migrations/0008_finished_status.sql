-- poker-clock: trim tournament statuses to the set the app uses
--
-- The lifecycle now runs: setup → registering → running → paused → finished
-- ('finished' = the clock ran out on the final level). The unused 'final_table'
-- and 'complete' statuses are dropped. Recreating the constraint is required
-- because the original was defined inline in 0001_init.sql (auto-named
-- `tournaments_status_check`).

-- Remap any legacy rows so the tightened constraint can't reject them.
update tournaments set status = 'finished' where status in ('final_table', 'complete');

alter table tournaments
  drop constraint if exists tournaments_status_check;

alter table tournaments
  add constraint tournaments_status_check
  check (status in ('setup', 'registering', 'running', 'paused', 'finished'));
