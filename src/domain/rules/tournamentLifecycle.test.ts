import { describe, expect, it } from 'vitest';
import {
  countRunningTournaments,
  DEFAULT_ENTRANT_COUNT,
  hasTournamentStarted,
  isTournamentInPlay,
  SCHEDULED_START_GRACE_MS,
  scheduledClockState,
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

/** The instant the admin pressed Stop, wherever a test needs one. */
const STOPPED_AT = '2026-08-10T22:10:00.000Z';

describe('scheduledClockState', () => {
  const tournamentStartAt = '2026-08-10T13:00:00.000Z';
  const at = (iso: string) => Date.parse(iso);

  it('is null before the scheduled start', () => {
    expect(scheduledClockState({ tournamentStartAt }, at('2026-08-10T12:59:59Z'))).toBeNull();
  });

  it('starts the clock at the scheduled instant, not when it was asked', () => {
    // An hour late: the clock still reads from 13:00, so a TV switched on at
    // 14:00 shows the level the tournament is actually on.
    const clock = scheduledClockState({ tournamentStartAt }, at('2026-08-10T14:00:00Z'));
    expect(clock).toEqual({
      currentLevelIndex: 0,
      levelStartedAtEpochMs: at(tournamentStartAt),
      pausedAccumulatedMs: 0,
      isPaused: false,
      pausedAtEpochMs: null,
    });
  });

  it('is null when the tournament is started by hand', () => {
    expect(scheduledClockState({}, at('2026-08-10T14:00:00Z'))).toBeNull();
  });

  it('gives the scheduler its grace, then reads silence as a refusal', () => {
    // The status still says the tournament never started. Inside the grace that
    // is the once-a-minute job not having run yet, so the clock is derived and
    // the room starts on time.
    const pending = { tournamentStartAt, status: 'setup' as const };
    expect(
      scheduledClockState(pending, at(tournamentStartAt) + SCHEDULED_START_GRACE_MS),
    ).not.toBeNull();

    // Past it, the job has had its chance and declined — the plan's running
    // allowance is the reason there is — so nothing is derived and no screen
    // shows a tournament that is not running.
    expect(
      scheduledClockState(pending, at(tournamentStartAt) + SCHEDULED_START_GRACE_MS + 1),
    ).toBeNull();

    // A tournament that did start keeps its clock however long ago that was.
    expect(
      scheduledClockState(
        { tournamentStartAt, status: 'running' },
        at('2026-08-10T20:00:00Z'),
      ),
    ).not.toBeNull();
  });

  it('derives without a status at all — the projector before its row arrives', () => {
    expect(
      scheduledClockState({ tournamentStartAt }, at('2026-08-10T20:00:00Z')),
    ).not.toBeNull();
  });

  it('is null once stopping has cleared the schedule', () => {
    const stopped = stopTournament(
      makeTournament({ status: 'running', tournamentStartAt }),
      STOPPED_AT,
    );
    expect(scheduledClockState(stopped, at('2026-08-10T14:00:00Z'))).toBeNull();
  });

  it('derives tonight’s clock from a weekly schedule', () => {
    // 2026-08-10 is a Monday in UTC+7; 20:00 there is 13:00 UTC.
    const weekly = makeTournament({
      scheduleRepeat: 'weekly',
      scheduleWeekdays: [1],
      startTime: '20:00',
    });
    // Half a minute in — inside the scheduler's grace, so this is the screens
    // covering the gap before the job writes the row.
    const clock = scheduledClockState(weekly, at('2026-08-10T13:00:30Z'));
    expect(clock?.levelStartedAtEpochMs).toBe(at('2026-08-10T13:00:00Z'));
  });

  it('stops deriving once the night is dismissed, and returns next week', () => {
    const weekly = makeTournament({
      scheduleRepeat: 'weekly',
      scheduleWeekdays: [1],
      startTime: '20:00',
      status: 'running',
    });
    const dismissed = stopTournament(weekly, '2026-08-10T14:00:00.000Z');

    expect(dismissed.scheduleWeekdays).toEqual([1]);
    // Tonight is over…
    expect(scheduledClockState(dismissed, at('2026-08-10T15:00:00Z'))).toBeNull();
    // …and the same weekday next week starts on its own.
    expect(
      scheduledClockState(dismissed, at('2026-08-17T13:00:30Z'))?.levelStartedAtEpochMs,
    ).toBe(at('2026-08-17T13:00:00Z'));
  });
});

describe('isTournamentInPlay', () => {
  it('is true only while a run is under way', () => {
    expect(isTournamentInPlay('running')).toBe(true);
    expect(isTournamentInPlay('paused')).toBe(true);
  });

  it('excludes finished, so a finish is never written twice', () => {
    expect(isTournamentInPlay('finished')).toBe(false);
  });

  it('excludes a reset tournament, whose spent clock must not re-finish it', () => {
    expect(isTournamentInPlay('setup')).toBe(false);
    expect(isTournamentInPlay('registering')).toBe(false);
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
    expect(stopTournament(tournament, STOPPED_AT)).toEqual({
      ...tournament,
      status: 'setup',
      entrantCount: DEFAULT_ENTRANT_COUNT,
      eliminatedCount: 0,
      rebuyCount: 0,
      addOnCount: 7,
      payoutTiers: [],
      payoutUnit: undefined,
      registrationOpenedAt: undefined,
      tournamentStartAt: undefined,
    });
  });

  it('clears the payouts, the same as Clear all on the payouts step', () => {
    const tournament = makeTournament({
      status: 'running',
      payoutTiers: [
        { position: 1, value: 60 },
        { position: 2, value: 40, note: '1 ticket happy hour' },
      ],
      payoutUnit: 'amount',
    });

    const stopped = stopTournament(tournament, STOPPED_AT);
    expect(stopped.payoutTiers).toEqual([]);
    expect(stopped.payoutUnit).toBeUndefined();
  });

  it('leaves add-on count untouched', () => {
    const tournament = makeTournament({ addOnCount: 9 });
    expect(stopTournament(tournament, STOPPED_AT).addOnCount).toBe(9);
  });

  it('drops the schedule, so the tournament cannot start itself again', () => {
    const tournament = makeTournament({
      status: 'running',
      tournamentStartAt: '2026-08-10T13:00:00.000Z',
    });

    expect(stopTournament(tournament, STOPPED_AT).tournamentStartAt).toBeUndefined();
  });

});

describe('countRunningTournaments', () => {
  const list = [
    { id: 'a', status: 'running' as const },
    { id: 'b', status: 'paused' as const },
    { id: 'c', status: 'setup' as const },
    { id: 'd', status: 'finished' as const },
  ];

  it('counts only the runs in play', () => {
    expect(countRunningTournaments(list)).toBe(2);
  });

  it('leaves the one about to start out of its own count', () => {
    expect(countRunningTournaments(list, 'a')).toBe(1);
    expect(countRunningTournaments(list, 'c')).toBe(2);
  });
});
