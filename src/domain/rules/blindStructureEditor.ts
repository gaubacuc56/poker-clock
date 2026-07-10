import type { BlindLevel } from '../entities';

/** Default starting blinds and level/break lengths for a freshly added row or preset. */
export const DEFAULT_SMALL_BLIND = 25;
export const DEFAULT_BIG_BLIND = 50;
export const DEFAULT_LEVEL_DURATION_SECONDS = 20 * 60;
export const DEFAULT_BREAK_DURATION_SECONDS = 10 * 60;

/** Re-sequences the `level` field to match array order (breaks included). */
export function renumberLevels(levels: BlindLevel[]): BlindLevel[] {
  return levels.map((level, index) => ({ ...level, level: index + 1 }));
}

/**
 * A new play level, continuing from the level it's inserted after when that's
 * a play level (copying its blinds/duration); otherwise starting from defaults.
 * Ante defaults to the big blind (big-blind-ante format).
 */
export function createLevelAfter(reference: BlindLevel | undefined): BlindLevel {
  const base = reference && !reference.isBreak ? reference : undefined;
  const bigBlind = base?.bigBlind ?? DEFAULT_BIG_BLIND;
  return {
    level: 0,
    smallBlind: base?.smallBlind ?? DEFAULT_SMALL_BLIND,
    bigBlind,
    ante: bigBlind,
    isBigBlindAnte: base?.isBigBlindAnte ?? false,
    durationSeconds: base?.durationSeconds ?? DEFAULT_LEVEL_DURATION_SECONDS,
    isBreak: false,
  };
}

/** A new break row of the default length. */
export function createBreak(): BlindLevel {
  return {
    level: 0,
    smallBlind: 0,
    bigBlind: 0,
    ante: 0,
    isBigBlindAnte: false,
    durationSeconds: DEFAULT_BREAK_DURATION_SECONDS,
    isBreak: true,
    breakLabel: 'Break',
  };
}
