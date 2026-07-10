export interface ClockState {
  currentLevelIndex: number;
  levelStartedAtEpochMs: number;
  pausedAccumulatedMs: number;
  isPaused: boolean;
  pausedAtEpochMs: number | null;
}
