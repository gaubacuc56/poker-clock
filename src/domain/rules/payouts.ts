import type { PayoutResult, PayoutStructure, PayoutTier, PayoutUnit } from '../entities';

export interface PayoutTotals {
  /** Sum of every tier's value — a percentage sum (should be 100) or a cents sum (should equal the guarantee). */
  total: number;
  target: number;
  isValid: boolean;
}

/**
 * Payouts are optional. When nothing is entered (no tiers, or every tier 0),
 * the structure is treated as empty — valid, and simply not shown anywhere.
 * Once any value is entered, tiers must sum to exactly 100% (percentage mode)
 * or exactly the guaranteed prize pool, in cents (amount mode).
 */
export function getPayoutTotals(
  tiers: PayoutTier[],
  unit: PayoutUnit,
  guaranteedPrizePoolCents: number,
): PayoutTotals {
  const total = tiers.reduce((sum, tier) => sum + tier.value, 0);
  const target = unit === 'amount' ? guaranteedPrizePoolCents : 100;
  return { total, target, isValid: total === 0 || total === target };
}

/** Whether any prize is actually configured — an empty or all-zero structure counts as "no payouts". */
export function hasPayouts(tiers: PayoutTier[]): boolean {
  return tiers.some((tier) => tier.value > 0);
}

export function calculatePrizePool(
  entrantCount: number,
  buyInCents: number,
): number {
  return entrantCount * buyInCents;
}

/**
 * In 'amount' mode, each tier's value already IS the cents payout — no
 * percentage math at all, so it always exactly matches what was typed.
 * In 'percentage' mode, percentage-to-cents rounding never loses money:
 * tiers are floored independently, and the leftover remainder (lost to
 * flooring) is added to 1st place so the returned amounts always sum to
 * exactly prizePoolCents.
 */
export function calculatePayouts(
  structure: PayoutStructure,
  prizePoolCents: number,
  unit: PayoutUnit = 'percentage',
): PayoutResult[] {
  const tiers = [...structure.tiers].sort((a, b) => a.position - b.position);
  if (tiers.length === 0) return [];

  if (unit === 'amount') {
    return tiers.map((tier) => ({
      position: tier.position,
      percentage: prizePoolCents > 0 ? (tier.value / prizePoolCents) * 100 : 0,
      amount: tier.value,
    }));
  }

  const flooredAmounts = tiers.map((tier) =>
    Math.floor((prizePoolCents * tier.value) / 100),
  );
  const distributed = flooredAmounts.reduce((sum, amount) => sum + amount, 0);
  const remainder = prizePoolCents - distributed;
  flooredAmounts[0] += remainder;

  return tiers.map((tier, index) => ({
    position: tier.position,
    percentage: tier.value,
    amount: flooredAmounts[index],
  }));
}
