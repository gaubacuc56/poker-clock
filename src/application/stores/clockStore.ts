import { create } from 'zustand';
import type { ClockState } from '@domain/entities';
import {
  adjustTime as adjustClockTime,
  createClockState,
  jumpToLevel,
  pauseClock,
  resumeClock,
} from '@domain/rules/blindProgression';

const MAX_HISTORY = 20;

function pushHistory(
  history: ClockState[],
  previous: ClockState | null,
): ClockState[] {
  if (!previous) return history;
  return [...history.slice(-(MAX_HISTORY - 1)), previous];
}

interface ClockStoreState {
  tournamentId: string | null;
  clock: ClockState | null;
  history: ClockState[];
  isMuted: boolean;
  start: (tournamentId: string, nowMs: number) => void;
  pause: (nowMs: number) => void;
  resume: (nowMs: number) => void;
  jump: (levelIndex: number, nowMs: number) => void;
  adjustTime: (deltaSeconds: number) => void;
  undo: () => void;
  toggleMute: () => void;
  /** Ends the current run entirely — the next Start begins a fresh clock at level 0. */
  stop: () => void;
  /** Applied by the projector window when it receives state from the control window, or when the control window hydrates from the last saved state. `null` means the clock was cleared/stopped remotely. */
  applyRemoteState: (tournamentId: string, clock: ClockState | null) => void;
}

export const useClockStore = create<ClockStoreState>((set, get) => ({
  tournamentId: null,
  clock: null,
  history: [],
  isMuted: false,
  start: (tournamentId, nowMs) => {
    set({ tournamentId, clock: createClockState(nowMs), history: [] });
  },
  pause: (nowMs) => {
    const { clock, history } = get();
    if (!clock) return;
    set({
      clock: pauseClock(clock, nowMs),
      history: pushHistory(history, clock),
    });
  },
  resume: (nowMs) => {
    const { clock, history } = get();
    if (!clock) return;
    set({
      clock: resumeClock(clock, nowMs),
      history: pushHistory(history, clock),
    });
  },
  jump: (levelIndex, nowMs) => {
    const { clock, history } = get();
    set({
      clock: jumpToLevel(levelIndex, nowMs),
      history: pushHistory(history, clock),
    });
  },
  adjustTime: (deltaSeconds) => {
    const { clock, history } = get();
    if (!clock) return;
    set({
      clock: adjustClockTime(clock, deltaSeconds),
      history: pushHistory(history, clock),
    });
  },
  undo: () => {
    const { history } = get();
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    set({ clock: previous, history: history.slice(0, -1) });
  },
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  stop: () => {
    set({ tournamentId: null, clock: null, history: [] });
  },
  applyRemoteState: (tournamentId, clock) => {
    set({ tournamentId, clock, history: [] });
  },
}));
