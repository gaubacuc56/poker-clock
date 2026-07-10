import { describe, expect, it } from 'vitest';
import { calculatePrizePoolForTournament, calculateTotalChipsInPlay } from './prizePool';
import type { TournamentConfig } from '../entities';

function makeTournament(overrides: Partial<TournamentConfig> = {}): TournamentConfig {
  return {
    id: 't1',
    name: 'Test',
    buyIn: 2000,
    fee: 0,
    startingStack: 10000,
    maxPlayersPerTable: 9,
    entrantCount: 0,
    eliminatedCount: 0,
    rebuyCount: 0,
    addOnCount: 0,
    lateRegLevel: 4,
    allowRebuy: true,
    allowAddOn: true,
    blindLevels: [],
    payoutTiers: [],
    createdAt: new Date(0).toISOString(),
    status: 'running',
    ...overrides,
  };
}

describe('calculatePrizePoolForTournament', () => {
  it('sums buy-ins only when there are no rebuys or add-ons', () => {
    const tournament = makeTournament({ buyIn: 2000, entrantCount: 3 });
    expect(calculatePrizePoolForTournament(tournament)).toBe(6000);
  });

  it('adds every rebuy and add-on at the buy-in cost', () => {
    const tournament = makeTournament({
      buyIn: 2000,
      entrantCount: 2,
      rebuyCount: 1,
      addOnCount: 1,
    });
    // 2 buy-ins (4000) + 1 rebuy (2000) + 1 add-on (2000)
    expect(calculatePrizePoolForTournament(tournament)).toBe(8000);
  });

  it('returns 0 for a tournament with no entrants and no guarantee', () => {
    const tournament = makeTournament();
    expect(calculatePrizePoolForTournament(tournament)).toBe(0);
  });

  it('uses the guarantee as-is when set, ignoring entrant/buy-in math entirely', () => {
    const tournament = makeTournament({
      buyIn: 2000,
      entrantCount: 3,
      guaranteedPrizePool: 100_000,
    });
    // 3 buy-ins would compute to 6,000, but the guarantee wins outright
    expect(calculatePrizePoolForTournament(tournament)).toBe(100_000);
  });

  it('still uses the guarantee even when the computed pool would be larger', () => {
    const tournament = makeTournament({
      buyIn: 2000,
      entrantCount: 100,
      guaranteedPrizePool: 100_000,
    });
    // 100 buy-ins would compute to 200,000, but the guarantee still wins
    expect(calculatePrizePoolForTournament(tournament)).toBe(100_000);
  });
});

describe('calculateTotalChipsInPlay', () => {
  it('sums the starting stack for every buy-in', () => {
    const tournament = makeTournament({ startingStack: 25_000, entrantCount: 2 });
    expect(calculateTotalChipsInPlay(tournament)).toBe(50_000);
  });

  it('adds the starting stack for every rebuy and add-on', () => {
    const tournament = makeTournament({
      startingStack: 25_000,
      entrantCount: 2,
      rebuyCount: 1,
      addOnCount: 1,
    });
    // 2 starting stacks (50,000) + 1 rebuy (25,000) + 1 add-on (25,000)
    expect(calculateTotalChipsInPlay(tournament)).toBe(100_000);
  });
});
