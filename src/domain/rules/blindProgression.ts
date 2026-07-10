import type { BlindLevel, BlindStructure, ClockState } from '../entities';

export function createClockState(nowMs: number): ClockState {
  return {
    currentLevelIndex: 0,
    levelStartedAtEpochMs: nowMs,
    pausedAccumulatedMs: 0,
    isPaused: false,
    pausedAtEpochMs: null,
  };
}

export function getElapsedMsInLevel(clock: ClockState, nowMs: number): number {
  const referenceMs = clock.isPaused ? (clock.pausedAtEpochMs ?? nowMs) : nowMs;
  return referenceMs - clock.levelStartedAtEpochMs - clock.pausedAccumulatedMs;
}

export function getSecondsRemaining(
  clock: ClockState,
  level: BlindLevel,
  nowMs: number,
): number {
  const elapsedSeconds = getElapsedMsInLevel(clock, nowMs) / 1000;
  return Math.max(0, level.durationSeconds - elapsedSeconds);
}

export function pauseClock(clock: ClockState, nowMs: number): ClockState {
  if (clock.isPaused) return clock;
  return { ...clock, isPaused: true, pausedAtEpochMs: nowMs };
}

export function resumeClock(clock: ClockState, nowMs: number): ClockState {
  if (!clock.isPaused || clock.pausedAtEpochMs === null) return clock;
  return {
    ...clock,
    isPaused: false,
    pausedAccumulatedMs:
      clock.pausedAccumulatedMs + (nowMs - clock.pausedAtEpochMs),
    pausedAtEpochMs: null,
  };
}

/** Shifts the level start time so secondsRemaining changes by deltaSeconds (negative to subtract). */
export function adjustTime(clock: ClockState, deltaSeconds: number): ClockState {
  return {
    ...clock,
    levelStartedAtEpochMs: clock.levelStartedAtEpochMs + deltaSeconds * 1000,
  };
}

export function jumpToLevel(levelIndex: number, nowMs: number): ClockState {
  return {
    currentLevelIndex: levelIndex,
    levelStartedAtEpochMs: nowMs,
    pausedAccumulatedMs: 0,
    isPaused: false,
    pausedAtEpochMs: null,
  };
}

export function shouldAutoAdvance(
  clock: ClockState,
  level: BlindLevel,
  nowMs: number,
): boolean {
  return !clock.isPaused && getSecondsRemaining(clock, level, nowMs) <= 0;
}

export function getLevel(
  structure: BlindStructure,
  levelIndex: number,
): BlindLevel | undefined {
  return structure.levels[levelIndex];
}

export function getNextLevel(
  structure: BlindStructure,
  currentLevelIndex: number,
): BlindLevel | undefined {
  return structure.levels[currentLevelIndex + 1];
}

/**
 * lateRegLevel is a 1-indexed BlindLevel.level value: the last level late
 * registration is open through. Comparison uses the level's own `level`
 * field, not the array index, so structures can be edited without shifting
 * the late-reg cutoff.
 */
export function isLateRegClosed(
  currentLevel: BlindLevel,
  lateRegLevel: number,
): boolean {
  return currentLevel.level > lateRegLevel;
}

/**
 * Seconds until the next break starts: remaining time in the current level
 * plus the full duration of every level in between. Returns 0 if already on
 * a break, or null if no break remains later in the structure.
 */
export function getSecondsUntilNextBreak(
  structure: BlindStructure,
  clock: ClockState,
  currentLevel: BlindLevel,
  nowMs: number,
): number | null {
  if (currentLevel.isBreak) return 0;

  let total = getSecondsRemaining(clock, currentLevel, nowMs);
  for (let i = clock.currentLevelIndex + 1; i < structure.levels.length; i++) {
    const level = structure.levels[i];
    if (level.isBreak) return total;
    total += level.durationSeconds;
  }
  return null;
}
