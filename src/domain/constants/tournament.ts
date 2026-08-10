import type { CurrencyUnit } from '../entities/tournament';

/**
 * What a tournament is priced in when it doesn't say. Tournaments created
 * before the currency picker shipped have no `currency` at all, so every
 * surface that reads one falls back to this rather than to its own literal.
 */
export const DEFAULT_CURRENCY: CurrencyUnit = 'USD';

/** Ante shown as "<big blind> BBA" when the level uses a big-blind ante. */
export const BIG_BLIND_ANTE_SUFFIX = 'BBA';

/** Placeholder for a level with no ante, and for any figure a tournament hasn't got yet. */
export const EMPTY_FIGURE = '–';
