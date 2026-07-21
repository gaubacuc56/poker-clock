import type { BlindLevel } from '../entities';
import { formatCompactNumber } from './format';

/**
 * "Level 3" for play levels, or the break heading for breaks — the hardcoded
 * "Break Time" text followed by the user's optional title (e.g. "Break Time 1st").
 */
export function formatLevelLabel(level: BlindLevel): string {
  if (level.isBreak) return formatBreakLabel(level);
  return `Level ${level.level}`;
}

/** "Break Time" plus the user's optional break title, e.g. "Break Time 1st". */
export function formatBreakLabel(level: BlindLevel): string {
  const title = level.breakLabel?.trim();
  return title ? `Break Time ${title}` : 'Break Time';
}

/** "Chip Race" plus the user's optional chip-race title, e.g. "Chip Race 1st". */
export function formatChipRaceLabel(level: BlindLevel): string {
  const title = level.chipRaceLabel?.trim();
  return title ? `Chip Race ${title}` : 'Chip Race';
}

/** "25 / 50" — small/big blind, spaced. Uses compact K/M/B/T notation. */
export function formatBlinds(level: BlindLevel): string {
  return `${formatCompactNumber(level.smallBlind)} / ${formatCompactNumber(level.bigBlind)}`;
}

/** "25/50/50" — small/big blind plus ante when present, slash-joined (compact next-level line). */
export function formatBlindsLine(level: BlindLevel): string {
  const parts = [
    formatCompactNumber(level.smallBlind),
    formatCompactNumber(level.bigBlind),
  ];
  if (level.ante > 0) parts.push(formatCompactNumber(level.ante));
  return parts.join('/');
}
