import { describe, expect, it } from 'vitest';
import { buildProjectorModel, REGISTERING_LABEL } from './projectorModel';
import type { BlindLevel, ProjectorData } from '../entities';

const OPENING_LEVEL: BlindLevel = {
  level: 1,
  smallBlind: 100,
  bigBlind: 200,
  ante: 0,
  isBigBlindAnte: false,
  durationSeconds: 1200,
  isBreak: false,
};

function makeData(overrides: Partial<ProjectorData> = {}): ProjectorData {
  return {
    tournamentName: 'Test',
    currency: 'USD',
    backgroundPath: undefined,
    entryPriceLines: [],
    startingStack: 10000,
    lateRegLevel: 0,
    prizePool: 0,
    payoutResults: [],
    currentLevel: OPENING_LEVEL,
    nextLevel: undefined,
    secondsRemaining: 600,
    isPaused: false,
    remainingPlayers: 0,
    totalRegistered: 0,
    totalEntries: 0,
    rebuyCount: 0,
    totalStack: 0,
    avgStack: 0,
    nextBreakSeconds: null,
    levelIndex: 0,
    levelCount: 1,
    ...overrides,
  };
}

describe('buildProjectorModel — registration', () => {
  it('replaces the level heading and counts down to the scheduled start', () => {
    const model = buildProjectorModel(
      makeData({ registration: { secondsRemaining: 900, elapsedFraction: 0.75 } }),
    );

    expect(model.clockStatus).toBe('registering');
    expect(model.levelLabel).toBe(REGISTERING_LABEL);
    expect(model.clockText).toBe('15:00');
    expect(model.elapsedFraction).toBe(0.75);
    expect(model.isRunning).toBe(true);
  });

  it('counts down from a window that has only just been opened', () => {
    // Registration can only be opened inside the lead window before a start, so
    // there is always something to count — the bar simply starts empty.
    const model = buildProjectorModel(
      makeData({ registration: { secondsRemaining: 21_600, elapsedFraction: 0 } }),
    );

    expect(model.levelLabel).toBe(REGISTERING_LABEL);
    expect(model.clockText).toBe('06:00:00');
    expect(model.elapsedFraction).toBe(0);
    expect(model.isRunning).toBe(true);
  });

  it('announces the opening level as what is coming, not as blinds in force', () => {
    const model = buildProjectorModel(
      makeData({
        nextLevel: { ...OPENING_LEVEL, level: 2, smallBlind: 200, bigBlind: 400 },
        registration: { secondsRemaining: 60, elapsedFraction: 0.9 },
      }),
    );

    // No blinds are in force before play opens; the level play opens on is the
    // one worth announcing, and it belongs on the "next" line.
    expect(model.showBlinds).toBe(false);
    expect(model.nextText).toBe('Next: 100/200');
  });

  it('stays in the plain tone however short the countdown gets', () => {
    const model = buildProjectorModel(
      makeData({ registration: { secondsRemaining: 5, elapsedFraction: 0.99 } }),
    );

    expect(model.isLowTime).toBe(false);
    expect(model.tone).toBe('normal');
  });

  it('lets a finished tournament outrank a stale registration window', () => {
    const model = buildProjectorModel(
      makeData({
        isFinished: true,
        registration: { secondsRemaining: 900, elapsedFraction: 0.75 },
      }),
    );

    expect(model.clockStatus).toBe('finished');
    expect(model.clockText).toBe('FINISHED');
  });

  it('leaves an unscheduled tournament exactly as it was', () => {
    const model = buildProjectorModel(makeData());

    expect(model.clockStatus).toBe('running');
    expect(model.levelLabel).toBe('Level 1');
    expect(model.clockText).toBe('10:00');
  });
});
