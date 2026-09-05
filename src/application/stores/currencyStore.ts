import { create, type StoreApi, type UseBoundStore } from 'zustand';
import type { CurrencyRepository } from '@domain/ports';
import type { Currency } from '@domain/entities';
import { loadOnce, type LoadOptions } from './loadOnce';

interface CurrencyStoreState {
  currencies: Currency[];
  isLoaded: boolean;
  isSaving: boolean;
  load: (options?: LoadOptions) => Promise<void>;
  reset: () => void;
  create: (name: string) => Promise<string | null>;
  remove: (id: string) => Promise<string | null>;
}

export function createCurrencyStore(
  repo: CurrencyRepository,
): UseBoundStore<StoreApi<CurrencyStoreState>> {
  return create<CurrencyStoreState>((set, get) => ({
    currencies: [],
    isLoaded: false,
    isSaving: false,
    load: loadOnce(
      () => get().isLoaded,
      async () => {
        const currencies = await repo.list();
        set({ currencies, isLoaded: true });
      },
    ),
    reset: () => set({ currencies: [], isLoaded: false }),
    create: async (name) => {
      set({ isSaving: true });
      try {
        const currency = await repo.create(name);
        set((state) => ({ currencies: [...state.currencies, currency] }));
        return null;
      } catch (err) {
        return err instanceof Error ? err.message : 'Could not add that unit.';
      } finally {
        set({ isSaving: false });
      }
    },
    remove: async (id) => {
      try {
        await repo.remove(id);
        set((state) => ({
          currencies: state.currencies.filter((currency) => currency.id !== id),
        }));
        return null;
      } catch (err) {
        return err instanceof Error ? err.message : 'Could not remove that unit.';
      }
    },
  }));
}
