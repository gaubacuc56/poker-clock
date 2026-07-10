import type { TournamentConfig } from '../entities';

/**
 * A player must be eliminated before they're allowed to rebuy, so the rebuy
 * count can never exceed the eliminated count. Returns an error message when
 * violated, or null when the counts are valid.
 */
export function validateRebuyCount(
  tournament: Pick<TournamentConfig, 'rebuyCount' | 'eliminatedCount'>,
): string | null {
  if (tournament.rebuyCount > tournament.eliminatedCount) {
    return 'Rebuys cannot exceed eliminations — a player must be eliminated before they can rebuy.';
  }
  return null;
}

/**
 * When rebuys/add-ons are enabled, their price must be entered and positive
 * — there's no sensible default to silently fall back to at setup time
 * (unlike display, which falls back to the buy-in for older tournaments).
 */
export function validateRebuyAddOnPrices(input: {
  allowRebuy: boolean;
  rebuyPrice: number;
  allowAddOn: boolean;
  addOnPrice: number;
}): string | null {
  if (input.allowRebuy && !(input.rebuyPrice > 0)) {
    return 'Rebuy price is required and must be greater than 0 when rebuys are allowed.';
  }
  if (input.allowAddOn && !(input.addOnPrice > 0)) {
    return 'Add-on price is required and must be greater than 0 when add-ons are allowed.';
  }
  return null;
}
