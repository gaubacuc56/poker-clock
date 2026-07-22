import type { BlindLevel, BlindStructure, TournamentConfig } from '../entities';
import { isClockFinished } from './blindProgression';

/** New tournaments — and any tournament that's just been stopped — start with this many buy-ins already counted. */
export const DEFAULT_ENTRANT_COUNT = 5;

/** Starting the clock also flips the tournament's status to 'running'. */
export function startTournament(tournament: TournamentConfig): TournamentConfig {
  return { ...tournament, status: 'running' };
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
 */
export function stopTournament(tournament: TournamentConfig): TournamentConfig {
  return {
    ...tournament,
    status: 'setup',
    entrantCount: DEFAULT_ENTRANT_COUNT,
    eliminatedCount: 0,
    rebuyCount: 0,
  };
}
