import type { Currency } from '../entities';

export interface CurrencyRepository {
  /** The standard units plus the signed-in account's own, in that order. */
  list(): Promise<Currency[]>;
  /**
   * Adds a unit belonging to the signed-in account, from the one name the
   * account typed. Implementations normalize that name themselves — nothing
   * un-normalized may reach storage, whoever called this.
   */
  create(name: string): Promise<Currency>;
  /** Removes one of the account's own units. Standard units cannot be removed. */
  remove(id: string): Promise<void>;
}
