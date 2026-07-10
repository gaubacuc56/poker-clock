import { useEffect } from 'react';
import type { ClockSyncGateway } from '@domain/ports';
import { useClockStore } from '../stores/clockStore';

interface ClockSyncHooks {
  /**
   * Used by the director control screen: hydrates from whatever was last
   * saved remotely (so a refresh/reopen resumes an already-running clock
   * instead of showing "Start Tournament" again), and pushes every local
   * clock state change. Returns `stop`, which clears the clock remotely too
   * — so the next Start begins fresh instead of resuming on reload.
   */
  useClockSyncControl: (tournamentId: string | undefined) => { stop: () => Promise<void> };
  /** Used by the projector screen: mirrors clock state pushed by the control screen, on any device. */
  useClockSyncProjector: (tournamentId: string | undefined) => void;
}

export function createClockSyncHooks(gateway: ClockSyncGateway): ClockSyncHooks {
  function useClockSyncControl(tournamentId: string | undefined): { stop: () => Promise<void> } {
    const clock = useClockStore((state) => state.clock);
    const storeTournamentId = useClockStore((state) => state.tournamentId);
    const applyRemoteState = useClockStore((state) => state.applyRemoteState);
    const stopLocal = useClockStore((state) => state.stop);

    // Hydrate from whatever was last saved remotely — covers a page refresh
    // or reopening the tab after a tournament was already started elsewhere.
    useEffect(() => {
      if (!tournamentId) return;
      let cancelled = false;
      gateway
        .fetch(tournamentId)
        .then((remoteClock) => {
          if (!cancelled && remoteClock) applyRemoteState(tournamentId, remoteClock);
        })
        .catch((error) => {
          console.error('Failed to fetch initial clock state', error);
        });
      return () => {
        cancelled = true;
      };
    }, [tournamentId, applyRemoteState]);

    useEffect(() => {
      if (!storeTournamentId || !clock) return;
      gateway.push(storeTournamentId, clock).catch((error) => {
        console.error('Failed to sync clock state', error);
      });
    }, [storeTournamentId, clock]);

    async function stop(): Promise<void> {
      if (tournamentId) {
        await gateway.clear(tournamentId);
      }
      stopLocal();
    }

    return { stop };
  }

  function useClockSyncProjector(tournamentId: string | undefined): void {
    const applyRemoteState = useClockStore((state) => state.applyRemoteState);

    useEffect(() => {
      if (!tournamentId) return;
      let cancelled = false;

      gateway
        .fetch(tournamentId)
        .then((clock) => {
          if (!cancelled && clock) applyRemoteState(tournamentId, clock);
        })
        .catch((error) => {
          console.error('Failed to fetch initial clock state', error);
        });

      const unsubscribe = gateway.subscribe(tournamentId, (clock) => {
        applyRemoteState(tournamentId, clock);
      });

      return () => {
        cancelled = true;
        unsubscribe();
      };
    }, [tournamentId, applyRemoteState]);
  }

  return { useClockSyncControl, useClockSyncProjector };
}
