import { describe, expect, it } from 'vitest';
import { calculatePayouts, calculatePrizePool, getPayoutTotals } from './payouts';
import { createDefaultPayoutTiers } from './presets/payoutStructures';
import type { PayoutStructure } from '../entities';

describe('calculatePrizePool', () => {
  it('multiplies entrants by buy-in, excluding fee', () => {
    expect(calculatePrizePool(10, 2000)).toBe(20_000);
  });
});

describe('calculatePayouts', () => {
  it('splits the pool exactly according to percentages', () => {
    const structure: PayoutStructure = {
      name: 'test',
      tiers: [
        { position: 1, value: 50 },
        { position: 2, value: 30 },
        { position: 3, value: 20 },
      ],
    };
    const results = calculatePayouts(structure, 10_000);
    expect(results).toEqual([
      { position: 1, percentage: 50, amount: 5000 },
      { position: 2, percentage: 30, amount: 3000 },
      { position: 3, percentage: 20, amount: 2000 },
    ]);
  });

  it('allocates rounding remainder to 1st place so amounts always sum to the pool', () => {
    const structure: PayoutStructure = {
      name: 'test',
      tiers: [
        { position: 1, value: 34 },
        { position: 2, value: 33 },
        { position: 3, value: 33 },
      ],
    };
    const results = calculatePayouts(structure, 1000);
    const total = results.reduce((sum, r) => sum + r.amount, 0);
    expect(total).toBe(1000);
    expect(results[0].amount).toBeGreaterThanOrEqual(results[1].amount);
  });

  it('returns an empty array for a structure with no tiers', () => {
    const structure: PayoutStructure = {
      name: 'test',
      tiers: [],
    };
    expect(calculatePayouts(structure, 1000)).toEqual([]);
  });

  it('the default payout tiers sum to exactly 100% and distribute the full pool', () => {
    const tiers = createDefaultPayoutTiers();
    const totalPercentage = tiers.reduce((sum, tier) => sum + tier.value, 0);
    expect(totalPercentage).toBe(100);

    const structure: PayoutStructure = { name: 'default', tiers };
    const results = calculatePayouts(structure, 123_456);
    const total = results.reduce((sum, r) => sum + r.amount, 0);
    expect(total).toBe(123_456);
  });

  describe('amount unit', () => {
    it('uses each tier value directly as the cents payout, no percentage math', () => {
      const structure: PayoutStructure = {
        name: 'test',
        tiers: [
          { position: 1, value: 500_000 },
          { position: 2, value: 300_000 },
          { position: 3, value: 200_000 },
        ],
      };
      const results = calculatePayouts(structure, 1_000_000, 'amount');
      expect(results).toEqual([
        { position: 1, percentage: 50, amount: 500_000 },
        { position: 2, percentage: 30, amount: 300_000 },
        { position: 3, percentage: 20, amount: 200_000 },
      ]);
    });

    it('does not distribute a rounding remainder in amount mode', () => {
      const structure: PayoutStructure = {
        name: 'test',
        tiers: [
          { position: 1, value: 333 },
          { position: 2, value: 333 },
          { position: 3, value: 334 },
        ],
      };
      const results = calculatePayouts(structure, 1000, 'amount');
      expect(results.map((r) => r.amount)).toEqual([333, 333, 334]);
    });
  });
});

describe('getPayoutTotals', () => {
  it('targets 100 in percentage mode, regardless of the guarantee', () => {
    const tiers = [{ position: 1, value: 60 }, { position: 2, value: 40 }];
    expect(getPayoutTotals(tiers, 'percentage', 999_999)).toEqual({
      total: 100,
      target: 100,
      isValid: true,
    });
  });

  it('flags an invalid percentage split', () => {
    const tiers = [{ position: 1, value: 60 }, { position: 2, value: 30 }];
    expect(getPayoutTotals(tiers, 'percentage', 0)).toEqual({
      total: 90,
      target: 100,
      isValid: false,
    });
  });

  it('targets the guaranteed prize pool in amount mode', () => {
    const tiers = [{ position: 1, value: 70_000 }, { position: 2, value: 30_000 }];
    expect(getPayoutTotals(tiers, 'amount', 100_000)).toEqual({
      total: 100_000,
      target: 100_000,
      isValid: true,
    });
  });

  it('flags an amount split that does not match the guarantee', () => {
    const tiers = [{ position: 1, value: 70_000 }, { position: 2, value: 20_000 }];
    expect(getPayoutTotals(tiers, 'amount', 100_000)).toEqual({
      total: 90_000,
      target: 100_000,
      isValid: false,
    });
  });
});
