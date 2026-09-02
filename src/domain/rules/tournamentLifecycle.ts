import type {
  BlindLevel,
  BlindStructure,
  ClockState,
  TournamentConfig,
  TournamentStatus,
} from '../entities';
import { createClockState, isClockFinished } from './blindProgression';
import {
  getSchedulePhase,
  scheduleOccurrence,
  type TournamentSchedule,
} from './tournamentSchedule';

/** New tournaments — and any tournament that's just been stopped — start with this many buy-ins already counted. */
export const DEFAULT_ENTRANT_COUNT = 5;

/** Starting the clock also flips the tournament's status to 'running'. */
export function startTournament(tournament: TournamentConfig): TournamentConfig {
  return { ...tournament, status: 'running' };
}

/**
 * How long a schedule keeps implying a clock nobody has written down.
 *
 * `advance_tournament_schedules` runs once a minute, so a start that has just
 * come round is legitimately unwritten for up to that long, and the screens
 * cover the gap by deriving the clock themselves — which is what lets a TV with
 * no app open anywhere begin on time.
 *
 * Past this, silence means refusal rather than lag. The database enforces the
 * plan's running-tournament allowance on the very update the job makes, so a
 * scheduled tournament whose status still says it never started is one that was
 * not allowed to, and a screen that kept deriving a clock for it would be
 * showing a tournament that is not running — the allowance bypassed on screen
 * even though the row says no. Two minutes: long enough that a slow or skipped
 * sweep is not mistaken for a refusal.
 */
export const SCHEDULED_START_GRACE_MS = 2 * 60_000;

/**
 * The clock a schedule implies right now, for a screen that has none written —
 * or null when the schedule implies nothing.
 *
 * `status` is read, not just the schedule: see
 * {@link SCHEDULED_START_GRACE_MS} for what an unwritten start means once the
 * scheduler has had its minute.
 */
export function scheduledClockState(
  schedule: TournamentSchedule & { status?: TournamentStatus },
  nowMs: number,
): ClockState | null {
  // Resolved, so a weekly schedule derives its clock from tonight's occurrence
  // rather than from a date nobody entered.
  const { tournamentStartAt } = scheduleOccurrence(schedule, nowMs);
  if (!tournamentStartAt) return null;
  const startAt = Date.parse(tournamentStartAt);
  if (Number.isNaN(startAt) || nowMs < startAt) return null;
  if (
    nowMs - startAt > SCHEDULED_START_GRACE_MS &&
    schedule.status != null &&
    !hasTournamentStarted(schedule.status)
  ) {
    return null;
  }
  return createClockState(startAt);
}

/**
 * How many of an account's tournaments are in play, ignoring one of them —
 * what the plan's running allowance is counted against when that one is about
 * to start.
 *
 * Counted here rather than in `planLimits` because "in play" is a lifecycle
 * fact: the same two statuses the database counts, and the same two
 * `isTournamentInPlay` answers for.
 */
export function countRunningTournaments(
  tournaments: readonly { id: string; status: TournamentStatus }[],
  exceptId?: string,
): number {
  return tournaments.filter(
    (tournament) => tournament.id !== exceptId && isTournamentInPlay(tournament.status),
  ).length;
}

/**
 * The run is still in play — the only states a finish can be detected from.
 *
 * A finished tournament is already finished, and one sitting at 'setup' or
 * 'registering' has no run to end: whatever clock is lying around belongs to a
 * previous one. Mirrors the rows `advance_tournament_schedules` scans, so the
 * database and the screens agree on what can finish.
 */
export function isTournamentInPlay(status: TournamentConfig['status']): boolean {
  return status === 'running' || status === 'paused';
}

/**
 * Whether the clock has been started at least once. 'setup' and 'registering'
 * are both still before the off — registration being open is precisely the state
 * of waiting to begin — so only these three mean the tournament is under way or
 * has been.
 */
export function hasTournamentStarted(status: TournamentConfig['status']): boolean {
  return status === 'running' || status === 'paused' || status === 'finished';
}

/**
 * The status a tournament reads as right now, for a screen that lists it.
 *
 * Registration is derived rather than written — nothing sets 'registering' any
 * more, because the countdown opens itself — so a tournament in the middle of
 * its countdown would otherwise be listed as 'setup', which is the one thing it
 * is not. Every other status is stored and is simply itself.
 */
export function displayedTournamentStatus(
  tournament: TournamentConfig,
  nowMs: number,
): TournamentStatus {
  if (tournament.status !== 'setup') return tournament.status;
  return getSchedulePhase(tournament, nowMs) === 'registering' ? 'registering' : 'setup';
}

/**
 * Marks a tournament as finished — the clock has run out on the final level.
 * Only the status changes; the counters stay put so the finished results
 * remain on screen until the admin resets (see {@link stopTournament}).
 */
export function finishTournament(tournament: TournamentConfig): TournamentConfig {
  return { ...tournament, status: 'finished' };
}

/**
 * Whether a tournament should read as finished: either its status has already
 * been persisted to 'finished', or the live clock has run out on the final
 * level. Screens that only have the clock (e.g. the read-only projector) can
 * derive this without waiting for the persisted status to refresh.
 */
export function isTournamentFinished(
  status: TournamentConfig['status'],
  structure: BlindStructure,
  currentLevel: BlindLevel,
  secondsRemaining: number,
): boolean {
  return (
    status === 'finished' ||
    isClockFinished(structure, currentLevel, secondsRemaining)
  );
}

/**
 * Stopping ends the run entirely — the live clock itself is reset
 * separately (via `ClockSyncGateway.clear`), and the tournament's own
 * counters reset here so the next Start begins fresh rather than resuming
 * mid-tournament. Add-ons are deliberately left untouched.
 *
 * The payout structure goes with the counters. Prizes are written for the field
 * that turned up — as a share of that pool, or as amounts against that night's
 * guarantee — so carrying them into a run that starts from zero entrants would
 * be quoting last night's numbers. Reset leaves the payouts as a new tournament
 * has them: none, and the default unit.
 *
 * What happens to the schedule depends on what kind it is, and `nowIso` is the
 * instant the admin stopped it.
 *
 * A dated schedule describes one occurrence, so stopping drops it — left in
 * place, a start time that hasn't arrived yet would put the tournament straight
 * back to waiting for itself.
 *
 * A weekly one is an arrangement, not an occurrence: stopping dismisses tonight
 * and the next day on the list still fires, which is the whole reason for
 * setting one. Turning it off means clearing its days in setup.
 */
export function stopTournament(
  tournament: TournamentConfig,
  nowIso: string,
): TournamentConfig {
  const ended = {
    ...tournament,
    status: 'setup' as const,
    entrantCount: DEFAULT_ENTRANT_COUNT,
    eliminatedCount: 0,
    rebuyCount: 0,
    payoutTiers: [],
    payoutUnit: undefined,
  };

  return tournament.scheduleRepeat === 'weekly'
    ? { ...ended, scheduleDismissedAt: nowIso }
    : { ...ended, tournamentStartAt: undefined };
}
