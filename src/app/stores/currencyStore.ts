import { create, type StoreApi, type UseBoundStore } from 'zustand';
import type { CurrencyRepository } from '@domain/ports';
import type { Currency } from '@domain/entities';

interface CurrencyStoreState {
  currencies: Currency[];
  isLoaded: boolean;
  load: () => Promise<void>;
}

export function createCurrencyStore(
  repo: CurrencyRepository,
): UseBoundStore<StoreApi<CurrencyStoreState>> {
  return create<CurrencyStoreState>((set) => ({
    currencies: [],
    isLoaded: false,
    load: async () => {
      const currencies = await repo.list();
      set({ currencies, isLoaded: true });
    },
  }));
}
