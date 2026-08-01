import type { PayoutResult, PayoutStructure, PayoutTier, PayoutUnit } from '../entities';
import { formatMoney } from './format';

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

/** Whether a tier says anything — a cash value, a written prize, or both. */
export function hasTierPrize(tier: PayoutTier): boolean {
  return tier.value > 0 || (tier.note?.trim() ?? '') !== '';
}

/** Whether any prize is actually configured — an empty structure, or one where
 *  no place has either a value or a note, counts as "no payouts". */
export function hasPayouts(tiers: PayoutTier[]): boolean {
  return tiers.some(hasTierPrize);
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
      ...noteOf(tier),
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
    ...noteOf(tier),
  }));
}

/** Spreads to `{ note }` only when the tier actually has one, so results of
 *  note-less structures keep exactly the shape they had before notes existed. */
function noteOf(tier: PayoutTier): { note?: string } {
  const note = tier.note?.trim();
  return note ? { note } : {};
}

/** One displayed payout line — a single place, or a range of consecutive places
 *  that all pay the same prize. */
export interface PayoutRow {
  from: number;
  to: number;
  amount: number;
  note?: string;
}

/** Collapse consecutive positions that pay the same prize into a single row
 *  (e.g. positions 9–12 with equal payouts become one "9 - 12" line). Places
 *  with different notes never merge, even when the cash amount matches. */
export function groupPayoutResults(results: PayoutResult[]): PayoutRow[] {
  const rows: PayoutRow[] = [];
  for (const result of results) {
    const last = rows[rows.length - 1];
    if (
      last &&
      last.amount === result.amount &&
      last.note === result.note &&
      result.position === last.to + 1
    ) {
      last.to = result.position;
    } else {
      rows.push({
        from: result.position,
        to: result.position,
        amount: result.amount,
        note: result.note,
      });
    }
  }
  return rows;
}

/** "1" for a single place, "9 - 12" for a range. */
export function formatPayoutPlace(row: PayoutRow): string {
  return row.from === row.to ? `${row.from}` : `${row.from} - ${row.to}`;
}

/** A place can pay cash, a written prize, or both — show whichever was filled
 *  in, joined with a "+" when there are two. */
export function formatPayoutPrize(row: PayoutRow): string {
  const parts: string[] = [];
  if (row.amount > 0) parts.push(formatMoney(row.amount));
  if (row.note) parts.push(row.note);
  // A place with neither still needs a cell; fall back to the formatted zero.
  return parts.length > 0 ? parts.join(' + ') : formatMoney(row.amount);
}
