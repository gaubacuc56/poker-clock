import { describe, expect, it } from 'vitest';
import { createBreak, createLevelAfter, renumberLevels } from './blindStructureEditor';
import type { BlindLevel } from '../entities';

const PLAY: BlindLevel = {
  level: 0,
  smallBlind: 100,
  bigBlind: 100,
  ante: 0,
  isBigBlindAnte: false,
  durationSeconds: 600,
  isBreak: false,
};

describe('renumberLevels', () => {
  it('numbers play levels sequentially and leaves breaks unnumbered', () => {
    const levels = renumberLevels([
      { ...PLAY },
      { ...PLAY },
      createBreak(),
      { ...PLAY },
    ]);
    expect(levels.map((l) => l.level)).toEqual([1, 2, 0, 3]);
  });

  it('does not let a break consume a level number (Level n → break → Level n+1)', () => {
    const levels = renumberLevels([
      { ...PLAY },
      createBreak(),
      { ...PLAY },
    ]);
    const playNumbers = levels.filter((l) => !l.isBreak).map((l) => l.level);
    expect(playNumbers).toEqual([1, 2]);
  });
});

describe('createBreak', () => {
  it('creates an unnumbered break with empty titles', () => {
    const brk = createBreak();
    expect(brk.isBreak).toBe(true);
    expect(brk.level).toBe(0);
    expect(brk.breakLabel).toBe('');
    expect(brk.chipRace).toBe(false);
    expect(brk.chipRaceLabel).toBe('');
  });
});

describe('createLevelAfter', () => {
  it('copies blinds from a preceding play level', () => {
    const next = createLevelAfter({ ...PLAY, smallBlind: 300, bigBlind: 600 });
    expect(next.smallBlind).toBe(300);
    expect(next.bigBlind).toBe(600);
    expect(next.isBreak).toBe(false);
  });
});
