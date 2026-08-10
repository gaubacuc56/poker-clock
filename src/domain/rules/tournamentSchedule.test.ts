import { describe, expect, it } from 'vitest';
import {
  formatRegistrationEnd,
  formatScheduleMoment,
  formatScheduleTime,
  getRegistrationWindow,
  getSchedulePhase,
  scheduleOccurrence,
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
  it('spells the time out without naming the offset', () => {
    expect(formatScheduleTime(UTC_NOON)).toBe('10/08/2026 19:00');
  });

  it('is empty when nothing was scheduled', () => {
    expect(formatScheduleTime(undefined)).toBe('');
  });
});

describe('formatScheduleMoment', () => {
  it('names the weekday of the UTC+7 date, not the device’s', () => {
    // 2026-08-10 is a Monday in UTC+7.
    expect(formatScheduleMoment(UTC_NOON)).toBe('Mon 10/08/2026 19:00');
  });

  it('names the day the organiser meant when UTC is still the day before', () => {
    // 20:00 UTC Monday is 03:00 Tuesday in UTC+7 — the schedule's day is Tuesday.
    expect(formatScheduleMoment('2026-08-10T20:00:00.000Z')).toBe('Tue 11/08/2026 03:00');
  });

  it('is empty when nothing was scheduled', () => {
    expect(formatScheduleMoment(undefined)).toBe('');
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

describe('scheduleOccurrence — weekly', () => {
  // 2026-08-10 is a Monday in UTC+7. 19:00/20:00 there are 12:00/13:00 UTC.
  const friday = 5;
  const monday = 1;
  const weekly = {
    scheduleRepeat: 'weekly' as const,
    scheduleWeekdays: [monday],
    registrationTime: '19:00',
    startTime: '20:00',
  };
  const at = (iso: string) => Date.parse(iso);

  it('resolves tonight while it is on', () => {
    expect(scheduleOccurrence(weekly, at('2026-08-10T12:30:00Z'))).toEqual({
      registrationStartAt: '2026-08-10T12:00:00.000Z',
      tournamentStartAt: '2026-08-10T13:00:00.000Z',
    });
  });

  it('keeps resolving tonight after its start, so the result stays up', () => {
    expect(scheduleOccurrence(weekly, at('2026-08-11T04:00:00Z'))).toEqual({
      registrationStartAt: '2026-08-10T12:00:00.000Z',
      tournamentStartAt: '2026-08-10T13:00:00.000Z',
    });
  });

  it('announces tonight a minute before it opens, not last week', () => {
    expect(scheduleOccurrence(weekly, at('2026-08-10T11:59:00Z'))).toEqual({
      registrationStartAt: '2026-08-10T12:00:00.000Z',
      tournamentStartAt: '2026-08-10T13:00:00.000Z',
    });
  });

  it('lets an occurrence go once its day is up, and announces the next', () => {
    // Wednesday: Monday's night is long over, so the coming Monday is what
    // there is to say — not a three-day-old result.
    expect(scheduleOccurrence(weekly, at('2026-08-12T09:00:00Z'))).toEqual({
      registrationStartAt: '2026-08-17T12:00:00.000Z',
      tournamentStartAt: '2026-08-17T13:00:00.000Z',
    });
  });

  it('skips a dismissed night and moves to the next one', () => {
    const dismissed = { ...weekly, scheduleDismissedAt: '2026-08-10T14:00:00.000Z' };
    expect(scheduleOccurrence(dismissed, at('2026-08-10T15:00:00Z'))).toEqual({
      registrationStartAt: '2026-08-17T12:00:00.000Z',
      tournamentStartAt: '2026-08-17T13:00:00.000Z',
    });
  });

  it('picks the nearest of several days', () => {
    const twoNights = { ...weekly, scheduleWeekdays: [monday, friday] };
    // Saturday: Friday's night is the most recent one that opened.
    expect(scheduleOccurrence(twoNights, at('2026-08-15T09:00:00Z')).registrationStartAt).toBe(
      '2026-08-14T12:00:00.000Z',
    );
  });

  it('is empty when the arrangement is off or half-written', () => {
    expect(scheduleOccurrence({ ...weekly, scheduleWeekdays: [] }, at('2026-08-10T12:30:00Z')))
      .toEqual({});
    expect(scheduleOccurrence({ ...weekly, startTime: undefined }, at('2026-08-10T12:30:00Z')))
      .toEqual({});
  });

  it('drives the phase the same way a dated schedule does', () => {
    expect(getSchedulePhase(weekly, at('2026-08-10T11:00:00Z'))).toBe('waiting');
    expect(getSchedulePhase(weekly, at('2026-08-10T12:30:00Z'))).toBe('registering');
    expect(getSchedulePhase(weekly, at('2026-08-10T13:30:00Z'))).toBe('start-due');
  });

  it('counts down to tonight’s start', () => {
    expect(getRegistrationWindow(weekly, at('2026-08-10T12:45:00Z'))).toEqual({
      secondsRemaining: 900,
      elapsedFraction: 0.75,
    });
  });

  it('leaves a dated schedule resolving to itself', () => {
    const once = {
      registrationStartAt: '2026-08-10T12:00:00.000Z',
      tournamentStartAt: '2026-08-10T13:00:00.000Z',
    };
    expect(scheduleOccurrence(once, at('2026-08-10T12:30:00Z'))).toEqual(once);
  });
});

describe('validateSchedule — weekly', () => {
  const weekly = { scheduleRepeat: 'weekly' as const };

  it('accepts an arrangement that is simply off', () => {
    expect(validateSchedule({ ...weekly, scheduleWeekdays: [] })).toBeNull();
  });

  it('rejects days with no start time, and a start time with no days', () => {
    expect(validateSchedule({ ...weekly, scheduleWeekdays: [5] })).toBe(
      'A weekly schedule needs a start time.',
    );
    expect(validateSchedule({ ...weekly, scheduleWeekdays: [], startTime: '20:00' })).toBe(
      'Pick at least one day for a weekly schedule.',
    );
  });

  it('applies the same two rules to the times of day', () => {
    const set = (registrationTime: string, startTime: string) =>
      validateSchedule({ ...weekly, scheduleWeekdays: [5], registrationTime, startTime });

    expect(set('19:00', '20:00')).toBeNull();
    expect(set('20:00', '19:00')).toBe('Tournament start must be after registration start.');
    expect(set('20:00', '20:00')).toBe('Tournament start must be after registration start.');
    expect(set('03:00', '20:00')).toBe(
      'Tournament start must be within 16 hours of registration start.',
    );
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

  it('rejects a moment already gone, but only when asked to check', () => {
    const past = {
      registrationStartAt: '2026-08-10T12:00:00Z',
      tournamentStartAt: '2026-08-10T13:00:00Z',
    };
    const now = Date.parse('2026-08-10T12:30:00Z');

    expect(validateSchedule(past, now)).toBe('The schedule cannot start in the past.');
    // No `nowMs`: an existing tournament can be re-read and re-saved without its
    // own history failing validation.
    expect(validateSchedule(past)).toBeNull();
  });

  it('accepts a schedule still ahead of now', () => {
    expect(
      validateSchedule(
        {
          registrationStartAt: '2026-08-10T12:00:00Z',
          tournamentStartAt: '2026-08-10T13:00:00Z',
        },
        Date.parse('2026-08-10T11:00:00Z'),
      ),
    ).toBeNull();
  });

  it('has nothing to check when either half is missing', () => {
    expect(validateSchedule({})).toBeNull();
    expect(validateSchedule({ registrationStartAt: '2026-08-10T12:00:00Z' })).toBeNull();
    expect(validateSchedule({ tournamentStartAt: '2026-08-10T12:00:00Z' })).toBeNull();
  });
});
