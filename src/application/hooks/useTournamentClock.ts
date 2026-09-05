import { useMemo } from 'react';
import {
  getActiveLevel,
  getLevel,
  getNextLevel,
  getSecondsUntilNextBreak,
} from '@domain/rules/blindProgression';
import type { BlindLevel, BlindStructure, ClockState, TournamentConfig } from '@domain/entities';
import { scheduledClockState } from '@domain/rules/tournamentLifecycle';
import { useClockStore } from '../stores/clockStore';
import { useClockTick } from './useClockTick';

export interface TournamentClock {
  /** The tournament's blind structure, or undefined when there's no tournament. */
  structure: BlindStructure | undefined;
  /**
   * The live clock: the one written for this tournament, or — before anything
   * has been written — the one its scheduled start implies.
   */
  clock: ClockState | null;
  /**
   * True when `clock` came from the schedule rather than from the store, so no
   * one has written this run down yet. The projector neither can nor needs to;
   * the control screen adopts it, which is what gives the operator a row to
   * pause and adjust.
   */
  isClockDerived: boolean;
  currentLevel: BlindLevel | undefined;
  nextLevel: BlindLevel | undefined;
  secondsRemaining: number;
  nextBreakSeconds: number | null;
  /**
   * The level index that is actually active given elapsed time — may be ahead
   * of `clock.currentLevelIndex` when levels have ended without the control
   * screen writing the advance yet. `currentLevel`/`nextLevel` reflect this.
   */
  activeLevelIndex: number;
  /** The current tick timestamp (ms), shared with the derived values above. */
  now: number;
}

export interface TournamentClockOptions {
  canStartFromSchedule?: boolean;
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
  { canStartFromSchedule = true }: TournamentClockOptions = {},
): TournamentClock {
  const clockState = useClockStore((state) => state.clock);
  const clockTournamentId = useClockStore((state) => state.tournamentId);
  const now = useClockTick();

  const structure = useMemo<BlindStructure | undefined>(
    () => (tournament ? { name: tournament.name, levels: tournament.blindLevels } : undefined),
    [tournament],
  );

  const isThisTournamentClock = !!tournament && clockTournamentId === tournament.id;
  const storedClock = isThisTournamentClock ? clockState : null;

  // A scheduled tournament runs off its start time until someone writes a clock
  // for it, so the TV begins on time with no app open anywhere. A written clock
  // is always the truth once it exists.
  const derivedClock =
    tournament && canStartFromSchedule ? scheduledClockState(tournament, now) : null;
  const clock = storedClock ?? derivedClock;
  const isClockDerived = !storedClock && !!derivedClock;

  // Resolve the level from elapsed time rather than the stored index, so every
  // screen rolls past a finished level on its own (the projector included).
  const active = structure && clock ? getActiveLevel(structure, clock, now) : undefined;
  const activeLevelIndex = active?.index ?? clock?.currentLevelIndex ?? 0;
  const currentLevel = structure && clock ? getLevel(structure, activeLevelIndex) : undefined;
  const nextLevel = structure && clock ? getNextLevel(structure, activeLevelIndex) : undefined;
  const secondsRemaining = active?.secondsRemaining ?? 0;
  const nextBreakSeconds =
    structure && clock && currentLevel
      ? getSecondsUntilNextBreak(structure, activeLevelIndex, secondsRemaining)
      : null;

  return {
    structure,
    clock,
    isClockDerived,
    currentLevel,
    nextLevel,
    secondsRemaining,
    nextBreakSeconds,
    activeLevelIndex,
    now,
  };
}
