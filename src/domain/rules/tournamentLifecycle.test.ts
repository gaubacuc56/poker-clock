import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ENTRANT_COUNT,
  hasTournamentStarted,
  startTournament,
  stopTournament,
} from './tournamentLifecycle';
import type { TournamentConfig } from '../entities';

function makeTournament(overrides: Partial<TournamentConfig> = {}): TournamentConfig {
  return {
    id: 't1',
    name: 'Test',
    buyIn: 2000,
    fee: 0,
    startingStack: 10000,
    maxPlayersPerTable: 9,
    entrantCount: 8,
    eliminatedCount: 3,
    rebuyCount: 2,
    addOnCount: 4,
    lateRegLevel: 4,
    allowRebuy: true,
    allowAddOn: true,
    blindLevels: [],
    payoutTiers: [],
    createdAt: new Date(0).toISOString(),
    status: 'setup',
    ...overrides,
  };
}

describe('startTournament', () => {
  it('sets status to running without touching anything else', () => {
    const tournament = makeTournament({ status: 'setup' });
    expect(startTournament(tournament)).toEqual({ ...tournament, status: 'running' });
  });
});

describe('hasTournamentStarted', () => {
  it('counts every state the clock has run in', () => {
    expect(hasTournamentStarted('running')).toBe(true);
    expect(hasTournamentStarted('paused')).toBe(true);
    expect(hasTournamentStarted('finished')).toBe(true);
  });

  it('does not count waiting to begin — registering included', () => {
    expect(hasTournamentStarted('setup')).toBe(false);
    expect(hasTournamentStarted('registering')).toBe(false);
  });
});

describe('stopTournament', () => {
  it('resets status, entrant count, eliminated count, and rebuy count', () => {
    const tournament = makeTournament({
      status: 'running',
      entrantCount: 12,
      eliminatedCount: 5,
      rebuyCount: 3,
      addOnCount: 7,
    });
    expect(stopTournament(tournament)).toEqual({
      ...tournament,
      status: 'setup',
      entrantCount: DEFAULT_ENTRANT_COUNT,
      eliminatedCount: 0,
      rebuyCount: 0,
      addOnCount: 7,
    });
  });

  it('leaves add-on count untouched', () => {
    const tournament = makeTournament({ addOnCount: 9 });
    expect(stopTournament(tournament).addOnCount).toBe(9);
  });

  it('drops the schedule, so a live registration window cannot reopen', () => {
    const tournament = makeTournament({
      status: 'running',
      registrationStartAt: '2026-08-10T12:00:00.000Z',
      tournamentStartAt: '2026-08-10T13:00:00.000Z',
    });
    const stopped = stopTournament(tournament);

    expect(stopped.registrationStartAt).toBeUndefined();
    expect(stopped.tournamentStartAt).toBeUndefined();
  });
});
