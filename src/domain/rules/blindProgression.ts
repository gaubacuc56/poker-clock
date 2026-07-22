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

export interface ActiveLevel {
  /** The level that is actually current given how much time has elapsed. */
  index: number;
  /** Seconds left in that level (floored at 0 on the final level). */
  secondsRemaining: number;
}

/** Rolls forward from the clock's stored level through every level whose full
 * duration has already elapsed. Shared by {@link getActiveLevel} and
 * {@link advanceClockToActiveLevel}. */
function rollForward(
  structure: BlindStructure,
  clock: ClockState,
  nowMs: number,
): { index: number; elapsedInLevelSeconds: number; skippedSeconds: number } {
  const levels = structure.levels;
  let index = Math.min(Math.max(clock.currentLevelIndex, 0), levels.length - 1);
  let elapsed = Math.max(0, getElapsedMsInLevel(clock, nowMs) / 1000);
  let skippedSeconds = 0;

  while (index < levels.length - 1 && elapsed >= levels[index].durationSeconds) {
    elapsed -= levels[index].durationSeconds;
    skippedSeconds += levels[index].durationSeconds;
    index++;
  }

  return { index, elapsedInLevelSeconds: elapsed, skippedSeconds };
}

/**
 * Resolves which level is genuinely active *now* by rolling forward from the
 * clock's stored level through any levels whose full duration has already
 * elapsed. This lets every screen — including the read-only projector — advance
 * across level boundaries on its own, without waiting for the control screen to
 * write the next level. Rolling stops at the final level, whose remaining time
 * just floors at 0. While paused, elapsed time is frozen, so no rollover occurs.
 */
export function getActiveLevel(
  structure: BlindStructure,
  clock: ClockState,
  nowMs: number,
): ActiveLevel {
  const { index, elapsedInLevelSeconds } = rollForward(structure, clock, nowMs);
  const secondsRemaining = Math.max(
    0,
    structure.levels[index].durationSeconds - elapsedInLevelSeconds,
  );
  return { index, secondsRemaining };
}

/**
 * Advances the clock to the level that is active now (per {@link getActiveLevel}),
 * BACKDATING the level start so the elapsed progress within that level is
 * preserved. Unlike {@link jumpToLevel} — which restarts a level from its full
 * duration — this keeps the countdown continuous, so persisting a time-based
 * rollover never makes the clock jump back to the level's initial value (e.g.
 * when the control screen is reopened after levels passed on the projector).
 */
export function advanceClockToActiveLevel(
  structure: BlindStructure,
  clock: ClockState,
  nowMs: number,
): ClockState {
  const { index, skippedSeconds } = rollForward(structure, clock, nowMs);
  return {
    currentLevelIndex: index,
    // Shift the start past the skipped levels (and fold in prior paused time),
    // leaving the active level's remaining time exactly where it stands now.
    levelStartedAtEpochMs:
      clock.levelStartedAtEpochMs + clock.pausedAccumulatedMs + skippedSeconds * 1000,
    pausedAccumulatedMs: 0,
    isPaused: false,
    pausedAtEpochMs: null,
  };
}

export function getNextLevel(
  structure: BlindStructure,
  currentLevelIndex: number,
): BlindLevel | undefined {
  return structure.levels[currentLevelIndex + 1];
}

/** How many playable (non-break) levels the structure has. */
export function getPlayLevelCount(structure: BlindStructure): number {
  return structure.levels.filter((l) => !l.isBreak).length;
}

/** True when `level` is the last playable level of the structure. */
export function isFinalPlayLevel(
  structure: BlindStructure,
  level: BlindLevel,
): boolean {
  return !level.isBreak && level.level === getPlayLevelCount(structure);
}

/**
 * The clock has run out on the final playable level — play is over. This is
 * the live, clock-derived signal every screen can compute on its own; the
 * persisted 'finished' status (see `finishTournament`) is written from it.
 */
export function isClockFinished(
  structure: BlindStructure,
  level: BlindLevel,
  secondsRemaining: number,
): boolean {
  return isFinalPlayLevel(structure, level) && secondsRemaining === 0;
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
 * Seconds until the next break starts: the seconds left in the current level
 * plus the full duration of every level in between. Returns 0 if already on
 * a break, or null if no break remains later in the structure. Takes the
 * active level index and its remaining seconds directly so it stays correct
 * after time-based rollover (see `getActiveLevel`).
 */
export function getSecondsUntilNextBreak(
  structure: BlindStructure,
  currentLevelIndex: number,
  secondsRemainingInCurrent: number,
): number | null {
  const currentLevel = structure.levels[currentLevelIndex];
  if (!currentLevel || currentLevel.isBreak) return currentLevel?.isBreak ? 0 : null;

  let total = secondsRemainingInCurrent;
  for (let i = currentLevelIndex + 1; i < structure.levels.length; i++) {
    const level = structure.levels[i];
    if (level.isBreak) return total;
    total += level.durationSeconds;
  }
  return null;
}
