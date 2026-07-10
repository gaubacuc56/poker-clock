import { create, type StoreApi, type UseBoundStore } from 'zustand';
import type { TournamentRepository } from '@domain/ports';
import type { TournamentConfig } from '@domain/entities';

interface TournamentStoreState {
  tournaments: TournamentConfig[];
  isLoaded: boolean;
  load: () => Promise<void>;
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
    load: async () => {
      const tournaments = await repo.list();
      set({ tournaments, isLoaded: true });
    },
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
