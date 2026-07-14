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
