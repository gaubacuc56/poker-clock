export type PayoutUnit = 'percentage' | 'amount';

export interface PayoutTier {
  position: number;
  /** Percentage points (0-100) when the tournament's payoutUnit is 'percentage'; a cents amount when 'amount'. */
  value: number;
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
}
