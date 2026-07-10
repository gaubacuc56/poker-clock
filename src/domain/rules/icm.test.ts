import { describe, expect, it } from 'vitest';
import { calculateICM } from './icm';

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

describe('calculateICM', () => {
  it('splits winner-take-all equally between two equal stacks', () => {
    const equities = calculateICM([500, 500], [1000]);
    expect(equities[0]).toBeCloseTo(500);
    expect(equities[1]).toBeCloseTo(500);
  });

  it('gives the bigger stack a proportionally larger share of a single payout', () => {
    const equities = calculateICM([750, 250], [1000]);
    expect(equities[0]).toBeCloseTo(750);
    expect(equities[1]).toBeCloseTo(250);
  });

  it('matches a hand-derived 3-player ICM result', () => {
    // Stacks 5000/3000/2000 (total 10000), payouts 50/30/20 of a 100 pool.
    // Derived by exact fractions: e.g. P(A 1st)=1/2, then P(A 2nd | B 1st)=5/7, etc.
    const equities = calculateICM([5000, 3000, 2000], [50, 30, 20]);
    expect(equities[0]).toBeCloseTo(38.392857, 4);
    expect(equities[1]).toBeCloseTo(32.75, 4);
    expect(equities[2]).toBeCloseTo(28.857143, 4);
    expect(sum(equities)).toBeCloseTo(100, 5);
  });

  it('always distributes exactly the total prize pool across all players', () => {
    const stacks = [4000, 3000, 2000, 1000];
    const payouts = [50, 30, 20];
    const equities = calculateICM(stacks, payouts);
    expect(sum(equities)).toBeCloseTo(sum(payouts), 5);
  });

  it('gives zero equity to a player with zero chips when others remain', () => {
    const equities = calculateICM([1000, 0], [100]);
    expect(equities[0]).toBeCloseTo(100);
    expect(equities[1]).toBeCloseTo(0);
  });

  it('handles more players than paid positions', () => {
    const equities = calculateICM([1000, 1000, 1000, 1000], [70, 30]);
    expect(equities).toHaveLength(4);
    expect(sum(equities)).toBeCloseTo(100, 5);
    equities.forEach((equity) => expect(equity).toBeCloseTo(25, 1));
  });
});
