import type { ClockState } from '../entities';

export interface ClockSyncGateway {
  push(tournamentId: string, clock: ClockState): Promise<void>;
  fetch(tournamentId: string): Promise<ClockState | null>;
  /** Deletes any live clock state for the tournament — used when a tournament is stopped so the next Start begins fresh. */
  clear(tournamentId: string): Promise<void>;
  /** Returns an unsubscribe function. Called with `null` when the clock state was cleared/stopped remotely. */
  subscribe(tournamentId: string, onChange: (clock: ClockState | null) => void): () => void;
}
