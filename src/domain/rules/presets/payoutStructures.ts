import type { PayoutTier } from '../../entities';

/**
 * Payouts are optional, so a new tournament starts with none — the organizer
 * adds places only if they want a payout table. An empty structure is valid and
 * is simply not displayed on the projector/control screens.
 */
export function createDefaultPayoutTiers(): PayoutTier[] {
  return [];
}
