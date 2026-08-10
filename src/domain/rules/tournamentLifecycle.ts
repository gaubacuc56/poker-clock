import type { BlindLevel, BlindStructure, TournamentConfig } from '../entities';
import { isClockFinished } from './blindProgression';

/** New tournaments — and any tournament that's just been stopped — start with this many buy-ins already counted. */
export const DEFAULT_ENTRANT_COUNT = 5;

/** Starting the clock also flips the tournament's status to 'running'. */
export function startTournament(tournament: TournamentConfig): TournamentConfig {
  return { ...tournament, status: 'running' };
}

export function openRegistration(tournament: TournamentConfig): TournamentConfig {
  return { ...tournament, status: 'registering' };
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
 * The schedule is dropped along with them. A schedule describes one occurrence,
 * and stopping is the admin declaring that occurrence over — left in place, a
 * registration window that hasn't elapsed yet would reopen on the very next
 * tick and put the tournament straight back to counting down. Scheduling
 * another run means saying when it is.
 */
export function stopTournament(tournament: TournamentConfig): TournamentConfig {
  return {
    ...tournament,
    status: 'setup',
    entrantCount: DEFAULT_ENTRANT_COUNT,
    eliminatedCount: 0,
    rebuyCount: 0,
    registrationStartAt: undefined,
    tournamentStartAt: undefined,
  };
}
