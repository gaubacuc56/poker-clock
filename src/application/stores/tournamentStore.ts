import { create, type StoreApi, type UseBoundStore } from 'zustand';
import type { TournamentRepository } from '@domain/ports';
import type { TournamentConfig } from '@domain/entities';
import { loadOnce, type LoadOptions } from './loadOnce';

interface TournamentStoreState {
  tournaments: TournamentConfig[];
  isLoaded: boolean;
  /** Fetches once; a second caller joins the first request. */
  load: (options?: LoadOptions) => Promise<void>;
  /** Drops everything held for the account that just signed out. */
  reset: () => void;
  save: (tournament: TournamentConfig) => Promise<void>;
  remove: (id: string) => Promise<void>;
  getById: (id: string) => TournamentConfig | undefined;
}

export function createTournamentStore(
  repo: TournamentRepository,
): UseBoundStore<StoreApi<TournamentStoreState>> {
  return create<TournamentStoreState>((set, get) => ({
    tournaments: [],
    isLoaded: false,
    load: loadOnce(
      () => get().isLoaded,
      async () => {
        const tournaments = await repo.list();
        set({ tournaments, isLoaded: true });
      },
    ),
    reset: () => set({ tournaments: [], isLoaded: false }),
    save: async (tournament) => {
      const saved = await repo.save(tournament);
      set((state) => ({
        tournaments: [saved, ...state.tournaments.filter((t) => t.id !== saved.id)],
      }));
    },
    remove: async (id) => {
      await repo.remove(id);
      set((state) => ({
        tournaments: state.tournaments.filter((t) => t.id !== id),
      }));
    },
    getById: (id) => get().tournaments.find((tournament) => tournament.id === id),
  }));
}
