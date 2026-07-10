import { useMemo } from 'react';
import {
  getLevel,
  getNextLevel,
  getSecondsRemaining,
  getSecondsUntilNextBreak,
} from '@domain/rules/blindProgression';
import type { BlindLevel, BlindStructure, ClockState, TournamentConfig } from '@domain/entities';
import { useClockStore } from '../stores/clockStore';
import { useClockTick } from './useClockTick';

export interface TournamentClock {
  /** The tournament's blind structure, or undefined when there's no tournament. */
  structure: BlindStructure | undefined;
  /** The live clock, but only when it belongs to this tournament (else null). */
  clock: ClockState | null;
  currentLevel: BlindLevel | undefined;
  nextLevel: BlindLevel | undefined;
  secondsRemaining: number;
  nextBreakSeconds: number | null;
  /** The current tick timestamp (ms), shared with the derived values above. */
  now: number;
}

/**
 * Derives the live clock view (current/next level, seconds remaining, next
 * break) for a tournament from the shared clock store. Both the Control and
 * Projector screens run the same derivation — this is the single place it
 * lives. `structure` is memoized so consumers can safely use it (and the
 * levels it points at) as effect dependencies without spurious re-runs.
 */
export function useTournamentClock(
  tournament: TournamentConfig | null | undefined,
): TournamentClock {
  const clockState = useClockStore((state) => state.clock);
  const clockTournamentId = useClockStore((state) => state.tournamentId);
  const now = useClockTick();

  const structure = useMemo<BlindStructure | undefined>(
    () => (tournament ? { name: tournament.name, levels: tournament.blindLevels } : undefined),
    [tournament],
  );

  const isThisTournamentClock = !!tournament && clockTournamentId === tournament.id;
  const clock = isThisTournamentClock ? clockState : null;
  const currentLevel = structure && clock ? getLevel(structure, clock.currentLevelIndex) : undefined;
  const nextLevel = structure && clock ? getNextLevel(structure, clock.currentLevelIndex) : undefined;
  const secondsRemaining =
    clock && currentLevel ? getSecondsRemaining(clock, currentLevel, now) : 0;
  const nextBreakSeconds =
    structure && clock && currentLevel
      ? getSecondsUntilNextBreak(structure, clock, currentLevel, now)
      : null;

  return { structure, clock, currentLevel, nextLevel, secondsRemaining, nextBreakSeconds, now };
}
