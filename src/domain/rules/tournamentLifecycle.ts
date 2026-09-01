import type { BlindLevel, BlindStructure, ClockState, TournamentConfig } from '../entities';
import { createClockState, isClockFinished } from './blindProgression';
import { scheduleOccurrence, type TournamentSchedule } from './tournamentSchedule';

/** New tournaments — and any tournament that's just been stopped — start with this many buy-ins already counted. */
export const DEFAULT_ENTRANT_COUNT = 5;

/** Starting the clock also flips the tournament's status to 'running'. */
export function startTournament(tournament: TournamentConfig): TournamentConfig {
  return { ...tournament, status: 'running' };
}

/**
 * Opening the doors: the operator's own act, and the only thing that starts the
 * registration countdown now that there is no scheduled registration instant.
 *
 * `nowIso` is both the record that it happened and where the countdown's
 * progress bar starts, so the room's countdown runs from the moment the doors
 * actually opened rather than from a time typed in yesterday. Callers gate this
 * on `canOpenRegistration`.
 */
export function openRegistration(
  tournament: TournamentConfig,
  nowIso: string,
): TournamentConfig {
  return { ...tournament, status: 'registering', registrationOpenedAt: nowIso };
}

export function scheduledClockState(
  schedule: TournamentSchedule,
  nowMs: number,
): ClockState | null {
  // Resolved, so a weekly schedule derives its clock from tonight's occurrence
  // rather than from a date nobody entered.
  const { tournamentStartAt } = scheduleOccurrence(schedule, nowMs);
  if (!tournamentStartAt) return null;
  const startAt = Date.parse(tournamentStartAt);
  if (Number.isNaN(startAt) || nowMs < startAt) return null;
  return createClockState(startAt);
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
    // The doors close with the run. Left set, the countdown would reopen on the
    // next occurrence without anyone asking for it.
    registrationOpenedAt: undefined,
  };

  return tournament.scheduleRepeat === 'weekly'
    ? { ...ended, scheduleDismissedAt: nowIso }
    : { ...ended, tournamentStartAt: undefined };
}
