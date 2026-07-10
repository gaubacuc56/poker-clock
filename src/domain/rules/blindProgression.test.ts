import { describe, expect, it } from 'vitest';
import {
  adjustTime,
  createClockState,
  getSecondsRemaining,
  getSecondsUntilNextBreak,
  isLateRegClosed,
  jumpToLevel,
  pauseClock,
  resumeClock,
  shouldAutoAdvance,
} from './blindProgression';
import type { BlindLevel, BlindStructure } from '../entities';

const LEVEL: BlindLevel = {
  level: 1,
  smallBlind: 25,
  bigBlind: 50,
  ante: 0,
  isBigBlindAnte: false,
  durationSeconds: 600,
  isBreak: false,
};

function makeStructure(levels: BlindLevel[]): BlindStructure {
  return { name: 'Test', levels };
}

describe('blindProgression', () => {
  it('counts down seconds remaining as time elapses', () => {
    const clock = createClockState(0);
    expect(getSecondsRemaining(clock, LEVEL, 0)).toBe(600);
    expect(getSecondsRemaining(clock, LEVEL, 100_000)).toBe(500);
    expect(getSecondsRemaining(clock, LEVEL, 600_000)).toBe(0);
    expect(getSecondsRemaining(clock, LEVEL, 700_000)).toBe(0); // never negative
  });

  it('freezes the countdown while paused and resumes without losing time', () => {
    let clock = createClockState(0);
    clock = pauseClock(clock, 100_000); // pause after 100s elapsed, 500s remaining
    expect(getSecondsRemaining(clock, LEVEL, 100_000)).toBe(500);
    expect(getSecondsRemaining(clock, LEVEL, 250_000)).toBe(500); // still paused, no drift

    clock = resumeClock(clock, 250_000); // resume 150s later (all paused time)
    expect(getSecondsRemaining(clock, LEVEL, 250_000)).toBe(500);
    expect(getSecondsRemaining(clock, LEVEL, 300_000)).toBe(450); // 50s of real countdown since resume
  });

  it('pausing twice in a row is a no-op', () => {
    let clock = createClockState(0);
    clock = pauseClock(clock, 100_000);
    const pausedAgain = pauseClock(clock, 200_000);
    expect(pausedAgain).toEqual(clock);
  });

  it('resuming when not paused is a no-op', () => {
    const clock = createClockState(0);
    expect(resumeClock(clock, 100_000)).toEqual(clock);
  });

  it('jumping to a level resets the clock for that level', () => {
    const clock = jumpToLevel(3, 500_000);
    expect(clock.isPaused).toBe(false);
    expect(clock.currentLevelIndex).toBe(3);
    expect(getSecondsRemaining(clock, LEVEL, 500_000)).toBe(600);
  });

  it('signals auto-advance only once time expires and not while paused', () => {
    const clock = createClockState(0);
    expect(shouldAutoAdvance(clock, LEVEL, 599_000)).toBe(false);
    expect(shouldAutoAdvance(clock, LEVEL, 600_000)).toBe(true);

    const paused = pauseClock(clock, 700_000);
    expect(shouldAutoAdvance(paused, LEVEL, 700_000)).toBe(false);
  });

  it('closes late registration once the current level exceeds the cutoff', () => {
    expect(isLateRegClosed({ ...LEVEL, level: 4 }, 4)).toBe(false);
    expect(isLateRegClosed({ ...LEVEL, level: 5 }, 4)).toBe(true);
  });

  it('sums the remaining current level plus full levels up to the next break', () => {
    const levels: BlindLevel[] = [
      { ...LEVEL, level: 1, durationSeconds: 600 },
      { ...LEVEL, level: 2, durationSeconds: 600 },
      { ...LEVEL, level: 3, isBreak: true, durationSeconds: 900 },
    ];
    const structure = makeStructure(levels);
    const clock = createClockState(0);
    // 500s left in level 1 (100s elapsed) + all of level 2 (600s)
    expect(getSecondsUntilNextBreak(structure, clock, levels[0], 100_000)).toBe(1100);
  });

  it('returns 0 when already on a break', () => {
    const levels: BlindLevel[] = [{ ...LEVEL, isBreak: true }];
    const structure = makeStructure(levels);
    const clock = createClockState(0);
    expect(getSecondsUntilNextBreak(structure, clock, levels[0], 0)).toBe(0);
  });

  it('returns null when no break remains in the structure', () => {
    const levels: BlindLevel[] = [
      { ...LEVEL, level: 1, durationSeconds: 600 },
      { ...LEVEL, level: 2, durationSeconds: 600 },
    ];
    const structure = makeStructure(levels);
    const clock = createClockState(0);
    expect(getSecondsUntilNextBreak(structure, clock, levels[0], 0)).toBeNull();
  });

  it('adjusting time shifts seconds remaining by the given delta', () => {
    const clock = createClockState(0);
    const withMoreTime = adjustTime(clock, 60);
    expect(getSecondsRemaining(withMoreTime, LEVEL, 0)).toBe(660);

    const withLessTime = adjustTime(clock, -60);
    expect(getSecondsRemaining(withLessTime, LEVEL, 0)).toBe(540);
  });
});
