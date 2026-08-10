import type { BlindLevel } from '../entities';

/** Default starting blinds and level/break lengths for a freshly added row or preset. */
export const DEFAULT_SMALL_BLIND = 100;
export const DEFAULT_BIG_BLIND = 100;

/**
 * Smallest chip denomination in play — every blind/ante value must be a multiple
 * of this, since there are no 25 or 50 chips. Also the minimum and step for inputs.
 */
export const BLIND_INCREMENT = 100;
export const DEFAULT_LEVEL_DURATION_SECONDS = 20 * 60;
export const DEFAULT_BREAK_DURATION_SECONDS = 10 * 60;

/**
 * Re-sequences the `level` field over play levels only — breaks are not counted
 * as levels, so a break sitting between Level n and Level n+1 does not consume a
 * number (the following play level is n+1, not n+2). Breaks are assigned level 0.
 */
export function renumberLevels(levels: BlindLevel[]): BlindLevel[] {
  let playLevel = 0;
  return levels.map((level) =>
    level.isBreak
      ? { ...level, level: 0 }
      : { ...level, level: ++playLevel },
  );
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

/**
 * A new break row. Breaks carry no level number, and the length is left unset
 * (0) so the editor shows an empty, placeholder-only field — the user fills it
 * in only if they want, otherwise it resolves to the default length on save.
 */
export function createBreak(): BlindLevel {
  return {
    level: 0,
    smallBlind: 0,
    bigBlind: 0,
    ante: 0,
    isBigBlindAnte: false,
    durationSeconds: 0,
    isBreak: true,
    breakLabel: '',
    chipRace: false,
    chipRaceLabel: '',
  };
}

/** One level replaced in place. Nothing is renumbered — a patch never changes
 *  which rows are play levels. */
export function updateLevelAt(
  levels: BlindLevel[],
  index: number,
  patch: Partial<BlindLevel>,
): BlindLevel[] {
  return levels.map((level, i) => (i === index ? { ...level, ...patch } : level));
}

/** A level inserted at `position`, with the play-level numbering redone around it. */
export function insertLevelAt(
  levels: BlindLevel[],
  position: number,
  level: BlindLevel,
): BlindLevel[] {
  const next = [...levels];
  next.splice(position, 0, level);
  return renumberLevels(next);
}

/**
 * A level removed and the rest renumbered. The last remaining level is kept: a
 * structure with nothing in it has no clock to run.
 */
export function removeLevelAt(levels: BlindLevel[], index: number): BlindLevel[] {
  if (levels.length <= 1) return levels;
  return renumberLevels(levels.filter((_, i) => i !== index));
}

/**
 * A level swapped with its neighbour one step in `direction`, renumbered after.
 * Moving off either end is a no-op rather than an error — the caller is a pair
 * of buttons, and the ends are where they get pressed.
 */
export function moveLevel(
  levels: BlindLevel[],
  index: number,
  direction: -1 | 1,
): BlindLevel[] {
  const target = index + direction;
  if (target < 0 || target >= levels.length) return levels;
  const next = [...levels];
  [next[index], next[target]] = [next[target], next[index]];
  return renumberLevels(next);
}

/**
 * Fills in defaults left unset in the editor before the structure is saved —
 * currently just a break with no length entered, which falls back to the
 * default break length.
 */
export function normalizeBlindLevels(levels: BlindLevel[]): BlindLevel[] {
  return levels.map((level) =>
    level.isBreak && level.durationSeconds <= 0
      ? { ...level, durationSeconds: DEFAULT_BREAK_DURATION_SECONDS }
      : level,
  );
}
