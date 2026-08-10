import { describe, expect, it } from 'vitest';
import {
  formatRegistrationEnd,
  formatScheduleTime,
  getRegistrationWindow,
  getSchedulePhase,
  scheduleIsoToLocal,
  scheduleLocalToIso,
  scheduleNowLocal,
  validateSchedule,
} from './tournamentSchedule';

/** 19:00 on 10 Aug 2026 in UTC+7 is 12:00 UTC the same day. */
const LOCAL_7PM = '2026-08-10T19:00';
const UTC_NOON = '2026-08-10T12:00:00.000Z';

describe('scheduleLocalToIso', () => {
  it('reads a datetime-local value as UTC+7 wall time', () => {
    expect(scheduleLocalToIso(LOCAL_7PM)).toBe(UTC_NOON);
  });

  it('accepts a value that carries seconds', () => {
    expect(scheduleLocalToIso('2026-08-10T19:00:30')).toBe('2026-08-10T12:00:30.000Z');
  });

  it('crosses back into the previous UTC day for early-morning times', () => {
    expect(scheduleLocalToIso('2026-08-10T03:00')).toBe('2026-08-09T20:00:00.000Z');
  });

  it('treats an empty field as no time at all', () => {
    expect(scheduleLocalToIso('')).toBeUndefined();
  });

  it('treats an unparseable value as no time at all', () => {
    expect(scheduleLocalToIso('not-a-date')).toBeUndefined();
  });
});

describe('scheduleIsoToLocal', () => {
  it('round-trips a stored instant back to the value the organiser typed', () => {
    expect(scheduleIsoToLocal(UTC_NOON)).toBe(LOCAL_7PM);
  });

  it('is empty for an absent or unparseable instant', () => {
    expect(scheduleIsoToLocal(undefined)).toBe('');
    expect(scheduleIsoToLocal('nonsense')).toBe('');
  });
});

describe('scheduleNowLocal', () => {
  it('gives the current moment in the picker\'s own format and timezone', () => {
    expect(scheduleNowLocal(Date.parse(UTC_NOON))).toBe(LOCAL_7PM);
  });

  it('orders against a picked value as a plain string', () => {
    const now = scheduleNowLocal(Date.parse(UTC_NOON));
    expect('2026-08-10T18:59' < now).toBe(true);
    expect('2026-08-10T19:01' > now).toBe(true);
  });
});

describe('formatScheduleTime', () => {
  it('spells the time out with the offset it belongs to', () => {
    expect(formatScheduleTime(UTC_NOON)).toBe('2026-08-10 19:00 UTC+7');
  });

  it('is empty when nothing was scheduled', () => {
    expect(formatScheduleTime(undefined)).toBe('');
  });
});

describe('formatRegistrationEnd', () => {
  it('announces the level and the wall-clock time the room expects it', () => {
    expect(formatRegistrationEnd(8, '20:30')).toBe('Reg End: Level 8 ( 20h30 )');
  });

  it('announces the level alone when no time was given', () => {
    expect(formatRegistrationEnd(8, undefined)).toBe('Reg End: Level 8');
    expect(formatRegistrationEnd(8, '')).toBe('Reg End: Level 8');
  });

  it('drops the seconds a time input may append', () => {
    expect(formatRegistrationEnd(3, '09:05:00')).toBe('Reg End: Level 3 ( 09h05 )');
  });

  it('announces the time alone when no level was given', () => {
    expect(formatRegistrationEnd(undefined, '20:30')).toBe('Reg End: 20h30');
    expect(formatRegistrationEnd(0, '20:30')).toBe('Reg End: 20h30');
    expect(formatRegistrationEnd(Number.NaN, '20:30')).toBe('Reg End: 20h30');
  });

  it('has nothing to announce when neither half was filled in', () => {
    expect(formatRegistrationEnd(undefined, undefined)).toBe('');
    expect(formatRegistrationEnd(0, '')).toBe('');
  });

  it('ignores a time it cannot read', () => {
    expect(formatRegistrationEnd(8, 'later')).toBe('Reg End: Level 8');
    expect(formatRegistrationEnd(undefined, 'later')).toBe('');
  });
});

describe('getSchedulePhase', () => {
  const registrationStartAt = '2026-08-10T12:00:00.000Z';
  const tournamentStartAt = '2026-08-10T13:00:00.000Z';
  const at = (iso: string) => Date.parse(iso);

  it('is unscheduled when neither time was set', () => {
    expect(getSchedulePhase({}, at('2026-08-10T12:30:00Z'))).toBe('unscheduled');
  });

  it('waits until the registration window opens', () => {
    expect(
      getSchedulePhase({ registrationStartAt, tournamentStartAt }, at('2026-08-10T11:59:59Z')),
    ).toBe('waiting');
  });

  it('registers from the moment registration opens', () => {
    expect(
      getSchedulePhase({ registrationStartAt, tournamentStartAt }, at(registrationStartAt)),
    ).toBe('registering');
  });

  it('stays registering right up to the start', () => {
    expect(
      getSchedulePhase({ registrationStartAt, tournamentStartAt }, at('2026-08-10T12:59:59Z')),
    ).toBe('registering');
  });

  it('is due from the start time onwards', () => {
    expect(
      getSchedulePhase({ registrationStartAt, tournamentStartAt }, at(tournamentStartAt)),
    ).toBe('start-due');
  });

  it('keeps registering indefinitely when no start time was set', () => {
    expect(getSchedulePhase({ registrationStartAt }, at('2030-01-01T00:00:00Z'))).toBe(
      'registering',
    );
  });

  it('reaches start-due even with no registration window in front of it', () => {
    expect(getSchedulePhase({ tournamentStartAt }, at(tournamentStartAt))).toBe('start-due');
    expect(getSchedulePhase({ tournamentStartAt }, at('2026-08-10T12:00:00Z'))).toBe('waiting');
  });
});

describe('getRegistrationWindow', () => {
  const registrationStartAt = '2026-08-10T12:00:00.000Z';
  const tournamentStartAt = '2026-08-10T13:00:00.000Z';

  it('counts down to the start and reports how much of the window has gone', () => {
    const window = getRegistrationWindow(
      { registrationStartAt, tournamentStartAt },
      Date.parse('2026-08-10T12:45:00Z'),
    );
    expect(window).toEqual({ secondsRemaining: 900, elapsedFraction: 0.75 });
  });

  it('has no countdown when no start time was set', () => {
    const window = getRegistrationWindow(
      { registrationStartAt },
      Date.parse('2026-08-10T12:45:00Z'),
    );
    expect(window).toEqual({ secondsRemaining: null, elapsedFraction: 0 });
  });

  it('is absent outside the registration window', () => {
    expect(
      getRegistrationWindow(
        { registrationStartAt, tournamentStartAt },
        Date.parse('2026-08-10T13:00:00Z'),
      ),
    ).toBeUndefined();
    expect(getRegistrationWindow({}, Date.parse('2026-08-10T12:45:00Z'))).toBeUndefined();
  });
});

describe('validateSchedule', () => {
  it('accepts a start after the registration opens', () => {
    expect(
      validateSchedule({
        registrationStartAt: '2026-08-10T12:00:00Z',
        tournamentStartAt: '2026-08-10T13:00:00Z',
      }),
    ).toBeNull();
  });

  it('rejects a start at or before the registration opens', () => {
    expect(
      validateSchedule({
        registrationStartAt: '2026-08-10T13:00:00Z',
        tournamentStartAt: '2026-08-10T12:00:00Z',
      }),
    ).toBe('Tournament start must be after registration start.');
    expect(
      validateSchedule({
        registrationStartAt: '2026-08-10T13:00:00Z',
        tournamentStartAt: '2026-08-10T13:00:00Z',
      }),
    ).toBe('Tournament start must be after registration start.');
  });

  it('accepts a window of exactly the maximum', () => {
    expect(
      validateSchedule({
        registrationStartAt: '2026-08-10T12:00:00Z',
        tournamentStartAt: '2026-08-11T04:00:00Z',
      }),
    ).toBeNull();
  });

  it('rejects a window longer than the maximum', () => {
    expect(
      validateSchedule({
        registrationStartAt: '2026-08-10T12:00:00Z',
        tournamentStartAt: '2026-08-11T04:00:01Z',
      }),
    ).toBe('Tournament start must be within 16 hours of registration start.');
  });

  it('has nothing to check when either half is missing', () => {
    expect(validateSchedule({})).toBeNull();
    expect(validateSchedule({ registrationStartAt: '2026-08-10T12:00:00Z' })).toBeNull();
    expect(validateSchedule({ tournamentStartAt: '2026-08-10T12:00:00Z' })).toBeNull();
  });
});
