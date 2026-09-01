import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClockState } from '@domain/entities';
import { createClockSyncHooks } from './useClockSync';
import { useClockStore } from '../stores/clockStore';

const TOURNAMENT_ID = 't1';

const REMOTE_CLOCK: ClockState = {
  currentLevelIndex: 2,
  levelStartedAtEpochMs: 1_700_000_000_000,
  isPaused: false,
  pausedAtEpochMs: null,
};

function makeGateway(remote: ClockState | null = REMOTE_CLOCK) {
  return {
    push: vi.fn(async () => {}),
    fetch: vi.fn(async () => remote),
    clear: vi.fn(async () => {}),
    subscribe: vi.fn(() => () => {}),
  };
}

beforeEach(() => {
  useClockStore.setState({ tournamentId: null, clock: null, history: [] });
});

describe('useClockSyncControl', () => {
  it('hydrates from the saved clock without writing it straight back', async () => {
    const gateway = makeGateway();
    const { useClockSyncControl } = createClockSyncHooks(gateway);

    renderHook(() => useClockSyncControl(TOURNAMENT_ID));

    await waitFor(() => expect(useClockStore.getState().clock).toEqual(REMOTE_CLOCK));
    // The row was read; reading it is not a reason to write it.
    expect(gateway.push).not.toHaveBeenCalled();
  });

  it('pushes a local change once', async () => {
    const gateway = makeGateway();
    const { useClockSyncControl } = createClockSyncHooks(gateway);

    renderHook(() => useClockSyncControl(TOURNAMENT_ID));
    await waitFor(() => expect(useClockStore.getState().clock).toEqual(REMOTE_CLOCK));

    act(() => useClockStore.getState().pause(1_700_000_060_000));

    await waitFor(() => expect(gateway.push).toHaveBeenCalledTimes(1));
    expect(gateway.push.mock.calls[0][1]).toEqual(useClockStore.getState().clock);
  });

  it('writes the first clock when nothing is saved yet', async () => {
    const gateway = makeGateway(null);
    const { useClockSyncControl } = createClockSyncHooks(gateway);

    renderHook(() => useClockSyncControl(TOURNAMENT_ID));
    act(() => useClockStore.getState().start(TOURNAMENT_ID, 1_700_000_000_000));

    await waitFor(() => expect(gateway.push).toHaveBeenCalledTimes(1));
  });
});
