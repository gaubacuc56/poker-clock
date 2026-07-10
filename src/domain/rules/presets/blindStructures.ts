import type { BlindLevel } from '../../entities';

type BlindPair = [smallBlind: number, bigBlind: number, ante: number];

const PROGRESSION: BlindPair[] = [
  [25, 50, 0],
  [50, 100, 0],
  [75, 150, 0],
  [100, 200, 0],
  [100, 200, 25],
  [150, 300, 25],
  [200, 400, 50],
  [250, 500, 50],
  [300, 600, 75],
  [400, 800, 100],
  [500, 1000, 100],
  [600, 1200, 200],
  [800, 1600, 200],
  [1000, 2000, 300],
  [1500, 3000, 400],
  [2000, 4000, 500],
];

const LEVEL_DURATION_SECONDS = 20 * 60;
const BREAK_EVERY_LEVELS = 4;
const BREAK_DURATION_SECONDS = 10 * 60;

/** Starting point for a new tournament's blind structure — fully editable afterward. */
export function createDefaultBlindLevels(): BlindLevel[] {
  const levels: BlindLevel[] = [];
  let levelNumber = 1;

  PROGRESSION.forEach(([smallBlind, bigBlind, ante], index) => {
    levels.push({
      level: levelNumber++,
      smallBlind,
      bigBlind,
      ante,
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
