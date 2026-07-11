import { describe, expect, it } from 'vitest';
import { averageStackInBigBlinds, computeTournamentStats } from './tournamentStats';
import type { TournamentConfig } from '../entities';

function makeTournament(overrides: Partial<TournamentConfig> = {}): TournamentConfig {
  return {
    id: 't1',
    name: 'Test',
    buyIn: 2000,
    fee: 0,
    startingStack: 10000,
    maxPlayersPerTable: 9,
    entrantCount: 9,
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

describe('computeTournamentStats', () => {
  it('derives stats purely from entrantCount/startingStack when nothing else happened', () => {
    const tournament = makeTournament({ entrantCount: 9, startingStack: 10_000 });
    const stats = computeTournamentStats(tournament);
    expect(stats).toEqual({
      totalRegistered: 9,
      remainingPlayers: 9,
      buyInCount: 9,
      rebuyCount: 0,
      addOnCount: 0,
      totalEntries: 9,
      totalStack: 90_000,
      avgStack: 10_000,
      lateRegLevel: 4,
      startingStack: 10_000,
    });
  });

  it('derives every stat from live buy-in/rebuy/elimination counters', () => {
    const tournament = makeTournament({
      startingStack: 10_000,
      entrantCount: 3,
      rebuyCount: 1,
      eliminatedCount: 1,
    });
    const stats = computeTournamentStats(tournament);
    expect(stats.totalRegistered).toBe(3);
    expect(stats.remainingPlayers).toBe(3); // 3 entrants - 1 eliminated + 1 rebuy
    expect(stats.buyInCount).toBe(3);
    expect(stats.rebuyCount).toBe(1);
    expect(stats.totalEntries).toBe(4);
    expect(stats.totalStack).toBe(40_000); // 3 starting stacks + 1 rebuy
    expect(stats.avgStack).toBeCloseTo(40_000 / 3); // total stack / 3 remaining
  });

  it('adds rebuys back to the current player count without changing total registered', () => {
    // 5/5 start, 2 eliminated -> 3/5, 1 rebuy -> 4/5
    const tournament = makeTournament({
      entrantCount: 5,
      eliminatedCount: 2,
      rebuyCount: 1,
    });
    const stats = computeTournamentStats(tournament);
    expect(stats.remainingPlayers).toBe(4);
    expect(stats.totalRegistered).toBe(5);
  });

  it('reports 0 average stack when nobody remains', () => {
    const tournament = makeTournament({ entrantCount: 1, eliminatedCount: 1 });
    expect(computeTournamentStats(tournament).avgStack).toBe(0);
  });

  it('clamps remaining players at 0 rather than going negative', () => {
    const tournament = makeTournament({ entrantCount: 1, eliminatedCount: 5 });
    expect(computeTournamentStats(tournament).remainingPlayers).toBe(0);
  });
});

describe('averageStackInBigBlinds', () => {
  it('divides the average stack by the big blind', () => {
    expect(averageStackInBigBlinds(20_000, 400)).toBe(50);
  });

  it('rounds to the nearest whole big blind', () => {
    expect(averageStackInBigBlinds(20_100, 400)).toBe(50);
    expect(averageStackInBigBlinds(20_300, 400)).toBe(51);
  });

  it('returns 0 when there is no big blind to divide by', () => {
    expect(averageStackInBigBlinds(20_000, 0)).toBe(0);
  });
});
