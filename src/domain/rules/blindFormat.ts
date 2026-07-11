import type { BlindLevel } from '../entities';
import { formatNumber } from './format';

/** "Level 3" for play levels, or the break's label (default "Break") for breaks. */
export function formatLevelLabel(level: BlindLevel): string {
  return level.isBreak ? ('Break Time') : `Level ${level.level}`;
}

/** "25 / 50" — small/big blind, spaced. */
export function formatBlinds(level: BlindLevel): string {
  return `${formatNumber(level.smallBlind)} / ${formatNumber(level.bigBlind)}`;
}

/** "25/50/50" — small/big blind plus ante when present, slash-joined (compact next-level line). */
export function formatBlindsLine(level: BlindLevel): string {
  const parts = [formatNumber(level.smallBlind), formatNumber(level.bigBlind)];
  if (level.ante > 0) parts.push(formatNumber(level.ante));
  return parts.join('/');
}
