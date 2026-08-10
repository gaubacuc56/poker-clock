import type { BlindLevel, BlindStructure, ClockState, TournamentConfig } from '../entities';
import { createClockState, isClockFinished } from './blindProgression';
import { scheduleOccurrence, type TournamentSchedule } from './tournamentSchedule';

/** New tournaments — and any tournament that's just been stopped — start with this many buy-ins already counted. */
export const DEFAULT_ENTRANT_COUNT = 5;

/** Starting the clock also flips the tournament's status to 'running'. */
export function startTournament(tournament: TournamentConfig): TournamentConfig {
  return { ...tournament, status: 'running' };
}

export function openRegistration(tournament: TournamentConfig): TournamentConfig {
  return { ...tournament, status: 'registering' };
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
 * What happens to the schedule depends on what kind it is, and `nowIso` is the
 * instant the admin stopped it.
 *
 * A dated schedule describes one occurrence, so stopping drops it — left in
 * place, a registration window that hasn't elapsed yet would reopen on the very
 * next tick and put the tournament straight back to counting down.
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
  };

  return tournament.scheduleRepeat === 'weekly'
    ? { ...ended, scheduleDismissedAt: nowIso }
    : { ...ended, registrationStartAt: undefined, tournamentStartAt: undefined };
}
