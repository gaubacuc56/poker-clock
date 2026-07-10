import type { PayoutTier } from '../../entities';

/** Starting point for a new tournament's payout structure — fully editable afterward. */
export function createDefaultPayoutTiers(): PayoutTier[] {
  return [
    { position: 1, value: 50 },
    { position: 2, value: 30 },
    { position: 3, value: 20 },
  ];
}
