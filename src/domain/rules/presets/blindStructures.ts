import type { BlindLevel } from '../../entities';
import {
  DEFAULT_BREAK_DURATION_SECONDS,
  DEFAULT_LEVEL_DURATION_SECONDS,
} from '../blindStructureEditor';

type BlindPair = [smallBlind: number, bigBlind: number];

// Multiples of 100 only — the smallest chip in play is 100 (no 25 or 50 chips).
const PROGRESSION: BlindPair[] = [
  [100, 100],
  [100, 200],
  [200, 300],
  [200, 400],
  [300, 500],
  [300, 600],
  [400, 800],
  [500, 1000],
  [600, 1200],
  [800, 1600],
  [1000, 2000],
  [1500, 3000],
  [2000, 4000],
  [3000, 6000],
  [4000, 8000],
  [5000, 10000],
];

const LEVEL_DURATION_SECONDS = DEFAULT_LEVEL_DURATION_SECONDS;
const BREAK_EVERY_LEVELS = 4;
const BREAK_DURATION_SECONDS = DEFAULT_BREAK_DURATION_SECONDS;

/** Starting point for a new tournament's blind structure — fully editable afterward. */
export function createDefaultBlindLevels(): BlindLevel[] {
  const levels: BlindLevel[] = [];
  let levelNumber = 1;

  PROGRESSION.forEach(([smallBlind, bigBlind], index) => {
    levels.push({
      level: levelNumber++,
      smallBlind,
      bigBlind,
      // Ante defaults to the big blind (big-blind ante is the common modern format).
      ante: bigBlind,
      isBigBlindAnte: false,
      durationSeconds: LEVEL_DURATION_SECONDS,
      isBreak: false,
    });

    const isLastPair = index === PROGRESSION.length - 1;
    if (!isLastPair && (index + 1) % BREAK_EVERY_LEVELS === 0) {
      levels.push({
        level: levelNumber++,
        smallBlind: 0,
        bigBlind: 0,
        ante: 0,
        isBigBlindAnte: false,
        durationSeconds: BREAK_DURATION_SECONDS,
        isBreak: true,
        breakLabel: 'Break Time',
      });
    }
  });

  return levels;
}
