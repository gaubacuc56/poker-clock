import type { BlindLevel } from '../../entities';
import {
  DEFAULT_BREAK_DURATION_SECONDS,
  DEFAULT_LEVEL_DURATION_SECONDS,
} from '../blindStructureEditor';

type BlindPair = [smallBlind: number, bigBlind: number];

const PROGRESSION: BlindPair[] = [
  [25, 50],
  [50, 100],
  [75, 150],
  [100, 200],
  [100, 200],
  [150, 300],
  [200, 400],
  [250, 500],
  [300, 600],
  [400, 800],
  [500, 1000],
  [600, 1200],
  [800, 1600],
  [1000, 2000],
  [1500, 3000],
  [2000, 4000],
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
        breakLabel: 'Break',
      });
    }
  });

  return levels;
}
