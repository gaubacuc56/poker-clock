import { describe, expect, it } from 'vitest';
import {
  findScheduleClashes,
  formatRegistrationEnd,
  formatScheduleMoment,
  formatScheduleTime,
  getRegistrationWindow,
  getSchedulePhase,
  REGISTRATION_LEAD_HOURS,
  scheduleOccurrence,
  scheduleIsoToLocal,
  scheduleLocalToIso,
  scheduleNowLocal,
  secondsUntilRegistrationOpens,
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
  const tournamentStartAt = '2026-08-10T13:00:00.000Z';
  const at = (iso: string) => Date.parse(iso);
  /** The countdown opens exactly this many hours before the start. */
  const leadOpensAt = '2026-08-10T07:00:00.000Z';

  it('is unscheduled when no start was set', () => {
    expect(getSchedulePhase({}, at('2026-08-10T12:30:00Z'))).toBe('unscheduled');
  });

  it('waits until the lead window, then registers with nobody pressing anything', () => {
    expect(getSchedulePhase({ tournamentStartAt }, at('2026-08-10T06:59:59Z'))).toBe('waiting');
    expect(getSchedulePhase({ tournamentStartAt }, at(leadOpensAt))).toBe('registering');
    expect(getSchedulePhase({ tournamentStartAt }, at('2026-08-10T12:59:59Z'))).toBe('registering');
  });

  it('is due from the start time onwards', () => {
    expect(getSchedulePhase({ tournamentStartAt }, at(tournamentStartAt))).toBe('start-due');
  });

  it('opens exactly the documented lead time out', () => {
    expect(at(tournamentStartAt) - at(leadOpensAt)).toBe(REGISTRATION_LEAD_HOURS * 3_600_000);
  });
});

describe('secondsUntilRegistrationOpens', () => {
  const tournamentStartAt = '2026-08-10T13:00:00.000Z';
  const at = (iso: string) => Date.parse(iso);

  it('counts down to the moment the board goes up', () => {
    expect(
      secondsUntilRegistrationOpens({ tournamentStartAt }, at('2026-08-10T06:00:00Z')),
    ).toBe(3600);
  });

  it('is null once it is running, and with nothing scheduled', () => {
    expect(
      secondsUntilRegistrationOpens({ tournamentStartAt }, at('2026-08-10T08:00:00Z')),
    ).toBeNull();
    expect(secondsUntilRegistrationOpens({}, at('2026-08-10T08:00:00Z'))).toBeNull();
  });
});

describe('getRegistrationWindow', () => {
  const tournamentStartAt = '2026-08-10T13:00:00.000Z';

  it('is the lead window itself: full when it opens, half gone halfway', () => {
    expect(
      getRegistrationWindow({ tournamentStartAt }, Date.parse('2026-08-10T07:00:00Z')),
    ).toEqual({ secondsRemaining: 6 * 3600, elapsedFraction: 0 });
    expect(
      getRegistrationWindow({ tournamentStartAt }, Date.parse('2026-08-10T10:00:00Z')),
    ).toEqual({ secondsRemaining: 3 * 3600, elapsedFraction: 0.5 });
  });

  it('is absent before the window opens, and once the start has come', () => {
    expect(
      getRegistrationWindow({ tournamentStartAt }, Date.parse('2026-08-10T06:59:59Z')),
    ).toBeUndefined();
    expect(
      getRegistrationWindow({ tournamentStartAt }, Date.parse('2026-08-10T13:00:00Z')),
    ).toBeUndefined();
    expect(getRegistrationWindow({}, Date.parse('2026-08-10T12:45:00Z'))).toBeUndefined();
  });
});

describe('scheduleOccurrence — weekly', () => {
  // 2026-08-10 is a Monday in UTC+7. 20:00 there is 13:00 UTC.
  const friday = 5;
  const monday = 1;
  const weekly = {
    scheduleRepeat: 'weekly' as const,
    scheduleWeekdays: [monday],
    startTime: '20:00',
  };
  const at = (iso: string) => Date.parse(iso);

  it('resolves tonight while it is on', () => {
    expect(scheduleOccurrence(weekly, at('2026-08-10T13:30:00Z'))).toEqual({
      tournamentStartAt: '2026-08-10T13:00:00.000Z',
    });
  });

  it('keeps resolving tonight after its start, so the result stays up', () => {
    expect(scheduleOccurrence(weekly, at('2026-08-11T04:00:00Z'))).toEqual({
      tournamentStartAt: '2026-08-10T13:00:00.000Z',
    });
  });

  it('announces tonight a minute before it starts, not last week', () => {
    expect(scheduleOccurrence(weekly, at('2026-08-10T12:59:00Z'))).toEqual({
      tournamentStartAt: '2026-08-10T13:00:00.000Z',
    });
  });

  it('lets an occurrence go once its day is up, and announces the next', () => {
    // Wednesday: Monday's night is long over, so the coming Monday is what
    // there is to say — not a three-day-old result.
    expect(scheduleOccurrence(weekly, at('2026-08-12T09:00:00Z'))).toEqual({
      tournamentStartAt: '2026-08-17T13:00:00.000Z',
    });
  });

  it('skips a dismissed night and moves to the next one', () => {
    const dismissed = { ...weekly, scheduleDismissedAt: '2026-08-10T14:00:00.000Z' };
    expect(scheduleOccurrence(dismissed, at('2026-08-10T15:00:00Z'))).toEqual({
      tournamentStartAt: '2026-08-17T13:00:00.000Z',
    });
  });

  it('picks the nearest of several days', () => {
    const twoNights = { ...weekly, scheduleWeekdays: [monday, friday] };
    // Saturday: Friday's night is the most recent one that started.
    expect(scheduleOccurrence(twoNights, at('2026-08-15T09:00:00Z')).tournamentStartAt).toBe(
      '2026-08-14T13:00:00.000Z',
    );
  });

  it('is empty when the arrangement is off or half-written', () => {
    expect(scheduleOccurrence({ ...weekly, scheduleWeekdays: [] }, at('2026-08-10T12:30:00Z')))
      .toEqual({});
    expect(scheduleOccurrence({ ...weekly, startTime: undefined }, at('2026-08-10T12:30:00Z')))
      .toEqual({});
  });

  it('drives the phase the same way a dated schedule does', () => {
    expect(getSchedulePhase(weekly, at('2026-08-10T06:00:00Z'))).toBe('waiting');
    expect(getSchedulePhase(weekly, at('2026-08-10T12:30:00Z'))).toBe('registering');
    expect(getSchedulePhase(weekly, at('2026-08-10T13:30:00Z'))).toBe('start-due');
  });

  it('puts tonight’s board up from six hours out', () => {
    expect(getSchedulePhase(weekly, at('2026-08-10T06:59:00Z'))).toBe('waiting');
    expect(getSchedulePhase(weekly, at('2026-08-10T07:00:00Z'))).toBe('registering');
  });

  it('leaves next week’s board down until next week’s own window', () => {
    // Tonight's countdown ran, and the following Monday morning is waiting again
    // with nothing to clear in between.
    expect(getSchedulePhase(weekly, at('2026-08-17T06:00:00Z'))).toBe('waiting');
  });

  it('counts down to tonight’s start', () => {
    expect(getRegistrationWindow(weekly, at('2026-08-10T12:45:00Z'))).toEqual({
      secondsRemaining: 900,
      elapsedFraction: 1 - 900 / (REGISTRATION_LEAD_HOURS * 3600),
    });
  });

  it('leaves a dated schedule resolving to itself', () => {
    const once = { tournamentStartAt: '2026-08-10T13:00:00.000Z' };
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

  it('accepts a complete arrangement', () => {
    expect(validateSchedule({ ...weekly, scheduleWeekdays: [5], startTime: '20:00' })).toBeNull();
  });
});

describe('validateSchedule', () => {
  it('has nothing to check on a tournament with no schedule', () => {
    expect(validateSchedule({})).toBeNull();
  });

  it('accepts a start still ahead of now', () => {
    expect(
      validateSchedule(
        { tournamentStartAt: '2026-08-10T13:00:00Z' },
        Date.parse('2026-08-10T11:00:00Z'),
      ),
    ).toBeNull();
  });

  it('rejects a moment already gone, but only when asked to check', () => {
    const past = { tournamentStartAt: '2026-08-10T13:00:00Z' };
    const now = Date.parse('2026-08-10T14:00:00Z');

    expect(validateSchedule(past, now)).toBe('The schedule cannot start in the past.');
    // No `nowMs`: an existing tournament can be re-read and re-saved without its
    // own history failing validation.
    expect(validateSchedule(past)).toBeNull();
  });
});

describe('findScheduleClashes', () => {
  const at = (iso: string) => Date.parse(iso);
  /** Monday 10 Aug 2026, 20:00 in UTC+7. */
  const startAt = '2026-08-10T13:00:00.000Z';
  const now = at('2026-08-10T02:00:00Z');
  const monday = 1;
  const tuesday = 2;

  const twoHoursLater = {
    id: 'later',
    name: 'Deep Stack',
    tournamentStartAt: '2026-08-10T15:00:00.000Z',
  };
  const nextDay = {
    id: 'tomorrow',
    name: 'Tomorrow Night',
    tournamentStartAt: '2026-08-11T13:00:00.000Z',
  };
  const weeklyMonday = {
    id: 'weekly',
    name: 'Monday Turbo',
    scheduleRepeat: 'weekly' as const,
    scheduleWeekdays: [monday],
    startTime: '22:00',
  };

  it('names the tournaments set to run within the lead time either side', () => {
    expect(findScheduleClashes({ tournamentStartAt: startAt }, [twoHoursLater, nextDay], now)).toEqual([
      { id: 'later', name: 'Deep Stack', startsAt: '2026-08-10T15:00:00.000Z' },
    ]);
  });

  it('counts the hours before the start as well as after', () => {
    const earlier = { id: 'early', name: 'Afternoon', tournamentStartAt: '2026-08-10T08:00:00.000Z' };
    const tooEarly = { id: 'noon', name: 'Lunchtime', tournamentStartAt: '2026-08-10T06:59:00.000Z' };
    expect(
      findScheduleClashes({ tournamentStartAt: startAt }, [tooEarly, earlier], now).map((c) => c.id),
    ).toEqual(['early']);
  });

  it('resolves a weekly schedule onto the evening being scheduled', () => {
    expect(findScheduleClashes({ tournamentStartAt: startAt }, [weeklyMonday], now)).toEqual([
      { id: 'weekly', name: 'Monday Turbo', startsAt: '2026-08-10T15:00:00.000Z' },
    ]);
    expect(
      findScheduleClashes(
        { tournamentStartAt: startAt },
        [{ ...weeklyMonday, scheduleWeekdays: [tuesday] }],
        now,
      ),
    ).toEqual([]);
  });

  it('reads a weekly schedule being written the same way', () => {
    const weeklyDraft = {
      scheduleRepeat: 'weekly' as const,
      scheduleWeekdays: [monday],
      startTime: '20:00',
    };
    expect(findScheduleClashes(weeklyDraft, [twoHoursLater], now).map((c) => c.id)).toEqual([
      'later',
    ]);
  });

  it('skips an occurrence the admin already dismissed', () => {
    const dismissed = { ...weeklyMonday, scheduleDismissedAt: '2026-08-10T16:00:00.000Z' };
    expect(findScheduleClashes({ tournamentStartAt: startAt }, [dismissed], now)).toEqual([]);
  });

  it('has nothing to say without a start of its own, or against nothing', () => {
    expect(findScheduleClashes({}, [twoHoursLater], now)).toEqual([]);
    expect(findScheduleClashes({ tournamentStartAt: startAt }, [], now)).toEqual([]);
    expect(
      findScheduleClashes({ tournamentStartAt: startAt }, [{ id: 'x', name: 'Unscheduled' }], now),
    ).toEqual([]);
  });

  it('lists the soonest first', () => {
    const ids = findScheduleClashes(
      { tournamentStartAt: startAt },
      [twoHoursLater, { id: 'early', name: 'Afternoon', tournamentStartAt: '2026-08-10T08:00:00.000Z' }],
      now,
    ).map((clash) => clash.id);
    expect(ids).toEqual(['early', 'later']);
  });
});
