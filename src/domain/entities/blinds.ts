export interface BlindLevel {
  level: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  isBigBlindAnte: boolean;
  durationSeconds: number;
  isBreak: boolean;
  /**
   * Free-text title shown next to the hardcoded "Break Time" text (e.g. "1st").
   * Only meaningful when `isBreak`. Breaks are NOT counted as play levels, so
   * this never affects level numbering.
   */
  breakLabel?: string;
  /** Whether this break includes a chip race (color-up). Only meaningful when `isBreak`. */
  chipRace?: boolean;
  /** Free-text title shown next to the hardcoded "Chip Race" text. Only meaningful when `chipRace`. */
  chipRaceLabel?: string;
  colorUp?: number[];
}

/**
 * A tournament's blind schedule. Not a persisted/shared entity of its own —
 * each tournament owns exactly one, stored as `TournamentConfig.blindLevels`.
 * This shape only exists so `lib/blindProgression.ts` has something to take
 * as a parameter; construct it inline from a tournament when needed.
 */
export interface BlindStructure {
  name: string;
  levels: BlindLevel[];
}
