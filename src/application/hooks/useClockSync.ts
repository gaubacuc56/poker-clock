import { useEffect, useRef } from 'react';
import type { ClockSyncGateway } from '@domain/ports';
import { useClockStore } from '../stores/clockStore';
import type { ClockState } from '@domain/entities';

/**
 * What a clock looks like on the server, as a comparable string.
 *
 * Object identity can't answer "is this already what the server has": hydrating
 * puts a freshly parsed object into the store, and pushing it straight back
 * would be a write of the row that was just read.
 */
function remoteSignature(tournamentId: string, clock: ClockState): string {
  return `${tournamentId}:${JSON.stringify(clock)}`;
}

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

    /** The state the server is known to hold, so it is never written twice. */
    const syncedRef = useRef<string | null>(null);

    // Hydrate from whatever was last saved remotely — covers a page refresh
    // or reopening the tab after a tournament was already started elsewhere.
    useEffect(() => {
      if (!tournamentId) return;
      let cancelled = false;
      gateway
        .fetch(tournamentId)
        .then((remoteClock) => {
          if (cancelled || !remoteClock) return;
          syncedRef.current = remoteSignature(tournamentId, remoteClock);
          applyRemoteState(tournamentId, remoteClock);
        })
        .catch((error) => {
          console.error('Failed to fetch initial clock state', error);
        });
      return () => {
        cancelled = true;
      };
    }, [tournamentId, applyRemoteState]);

    useEffect(() => {
      if (!storeTournamentId || !clock) {
        syncedRef.current = null;
        return;
      }

      const signature = remoteSignature(storeTournamentId, clock);
      if (signature === syncedRef.current) return;

      syncedRef.current = signature;
      gateway.push(storeTournamentId, clock).catch((error) => {
        syncedRef.current = null;
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
