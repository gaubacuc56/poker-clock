export type PayoutUnit = 'percentage' | 'amount';

export interface PayoutTier {
  position: number;
  /** Percentage points (0-100) when the tournament's payoutUnit is 'percentage'; a cents amount when 'amount'. */
  value: number;
  /** Free-text prize for this place, e.g. "1 ticket happy hour". Shown instead
   *  of the amount when the value is 0, and alongside it when both are set. */
  note?: string;
}

/**
 * A tournament's payout split. Not a persisted/shared entity of its own —
 * each tournament owns exactly one, stored as `TournamentConfig.payoutTiers`.
 * This shape only exists so `lib/payouts.ts` has something to take as a
 * parameter; construct it inline from a tournament when needed.
 */
export interface PayoutStructure {
  name: string;
  tiers: PayoutTier[];
}

export interface PayoutResult {
  position: number;
  percentage: number;
  amount: number; // cents
  /** Carried through from the tier, when one was entered. */
  note?: string;
}
