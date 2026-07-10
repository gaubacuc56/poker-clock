import type { Currency } from '../entities';

export interface CurrencyRepository {
  list(): Promise<Currency[]>;
}
