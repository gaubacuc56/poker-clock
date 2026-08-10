/**
 * When a tournament opens for registration and when it starts.
 *
 * Both are optional: a tournament with no schedule behaves exactly as it always
 * has — the admin starts it by hand. Setting them turns the projector into a
 * countdown board first and, when a start time is given, starts the clock on
 * its own.
 */

/**
 * Schedules are read and written in Indochina Time, whatever timezone the
 * admin's device is in: the tournament happens at a place, not on a laptop.
 * ICT has never observed daylight saving, so a fixed offset is the whole rule —
 * no timezone database, no per-date lookup.
 */
export const SCHEDULE_UTC_OFFSET_MINUTES = 7 * 60;

const OFFSET_MS = SCHEDULE_UTC_OFFSET_MINUTES * 60_000;

/**
 * How long registration may stay open before the tournament starts. A window
 * longer than this is a mistyped date rather than a real plan — and it is worth
 * catching at setup, because the projector would otherwise sit on a countdown
 * measured in days.
 */
export const MAX_REGISTRATION_WINDOW_HOURS = 16;

const MAX_REGISTRATION_WINDOW_MS = MAX_REGISTRATION_WINDOW_HOURS * 60 * 60_000;

/**
 * Whether the schedule describes one occurrence or repeats every week.
 *
 * Absent means `once` — every tournament written before repeating shipped
 * describes a single evening.
 */
export type ScheduleRepeat = 'once' | 'weekly';

/** Sunday-first, matching `Date.getUTCDay()`. */
export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * When a tournament opens and starts, as stored.
 *
 * Two shapes behind one interface. A `once` schedule names two instants. A
 * `weekly` one names days of the week and two times of day, and the instants are
 * worked out per occurrence — the whole point being that a weekly schedule
 * survives the run it started, so an organiser sets Friday 19:00 once rather
 * than re-entering tomorrow's date every evening.
 *
 * Everything downstream reads only the resolved pair, via
 * {@link scheduleOccurrence}, so the two shapes never have to be handled twice.
 */
export interface TournamentSchedule {
  /** Absent = 'once'. */
  scheduleRepeat?: ScheduleRepeat;

  /** `once`: the instants themselves. */
  registrationStartAt?: string;
  tournamentStartAt?: string;

  /** `weekly`: which days it fires on (0 = Sunday … 6 = Saturday, in UTC+7). */
  scheduleWeekdays?: number[];
  /** `weekly`: times of day in UTC+7, `HH:mm`, both on the same day. */
  registrationTime?: string;
  startTime?: string;

  /**
   * The instant an occurrence was dismissed — Stop, on a weekly schedule.
   *
   * Occurrences that opened at or before this are skipped and the next one still
   * fires: stopping ends tonight, not the arrangement. A weekly alarm cannot be
   * cleared by stopping it, because then it would not be an alarm; turning it
   * off means clearing its days in setup.
   */
  scheduleDismissedAt?: string;
}

/**
 * Where a tournament sits against its schedule right now.
 *
 * `waiting` and `unscheduled` both mean "nothing to do yet", but they are not
 * the same thing — a tournament that is merely early still has a schedule to
 * announce, and screens are free to say so.
 */
export type SchedulePhase = 'unscheduled' | 'waiting' | 'registering' | 'start-due';

/** The countdown a registering tournament shows, in the terms a screen draws. */
export interface RegistrationWindow {
  /**
   * Seconds until the scheduled start, or `null` when no start time was given —
   * registration then stays open until the admin starts the tournament, and
   * there is no countdown to draw at all.
   */
  secondsRemaining: number | null;
  /** 0…1 of the registration window already elapsed; 0 when open-ended. */
  elapsedFraction: number;
}

/**
 * A datetime-local input's value (UTC+7 wall time) as a UTC instant, or
 * undefined when the field was left empty.
 */
export function scheduleLocalToIso(local: string): string | undefined {
  if (!local) return undefined;
  // datetime-local omits seconds unless a step asks for them; both parse the
  // same once the trailing Z declares the string is being read as UTC+7 first.
  const withSeconds = local.length === 16 ? `${local}:00` : local;
  const shifted = Date.parse(`${withSeconds}Z`);
  if (Number.isNaN(shifted)) return undefined;
  return new Date(shifted - OFFSET_MS).toISOString();
}

/** A stored instant as a datetime-local input's value in UTC+7. */
export function scheduleIsoToLocal(iso: string | undefined): string {
  if (!iso) return '';
  const instant = Date.parse(iso);
  if (Number.isNaN(instant)) return '';
  return new Date(instant + OFFSET_MS).toISOString().slice(0, 16);
}

/**
 * Now, as a datetime-local value in UTC+7 — the earliest moment a schedule
 * picker may offer. Same format as the input's own value, so the two compare
 * lexicographically as well as chronologically.
 */
export function scheduleNowLocal(nowMs: number): string {
  return scheduleIsoToLocal(new Date(nowMs).toISOString());
}

/**
 * The registration-close announcement, built from whichever halves were
 * actually filled in — or an empty string when neither was.
 *
 * Both halves are independent because they answer different questions and a
 * director may only know one of them: which level closes registration, or what
 * time the room expects to be there. Whatever is known goes on the screen.
 *
 *   level + time   Reg End: Level 8 ( 20h30 )
 *   level only     Reg End: Level 8
 *   time only      Reg End: 20h30
 */
export function formatRegistrationEnd(
  level: number | undefined,
  time: string | undefined,
): string {
  const hasLevel = level != null && Number.isFinite(level) && level > 0;
  const clock = formatWallClock(time);

  if (hasLevel) {
    return clock ? `Reg End: Level ${level} ( ${clock} )` : `Reg End: Level ${level}`;
  }
  // With no level, the parentheses have nothing to sit beside — the time is the
  // whole announcement, so it is stated plainly.
  return clock ? `Reg End: ${clock}` : '';
}

/** `HH:mm` as the room says it — "20h30". Empty when the value isn't a time. */
function formatWallClock(time: string | undefined): string {
  if (!time) return '';
  const match = /^(\d{2}):(\d{2})/.exec(time);
  return match ? `${match[1]}h${match[2]}` : '';
}

/**
 * A stored instant with its weekday — "Tue 2026-08-11 19:00 UTC+7".
 *
 * The weekday earns its place on a screen announcing what is next: a schedule set
 * by weekday is read back the same way it was entered, and it saves the operator
 * working out which day a date is.
 */
export function formatScheduleMoment(iso: string | undefined): string {
  const local = scheduleIsoToLocal(iso);
  if (!local) return '';
  const [date, time] = local.split('T');
  // Parsed as UTC so the weekday matches the UTC+7 date, not the device's.
  const weekday = WEEKDAY_LABELS[new Date(`${date}T00:00:00Z`).getUTCDay()];
  return `${weekday} ${formatScheduleDate(date)} ${time}`;
}

/**
 * The app's date format, wherever a date is shown: `dd/mm/yyyy`.
 *
 * Assembled from the UTC+7 wall-clock string rather than handed to a locale
 * formatter, so one tournament reads identically on every device in the room —
 * a projector, a phone and a laptop set to three different locales would
 * otherwise disagree about which number is the month.
 */
function formatScheduleDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

export function formatScheduleTime(iso: string | undefined): string {
  const local = scheduleIsoToLocal(iso);
  if (!local) return '';
  const [date, time] = local.split('T');
  return `${formatScheduleDate(date)} ${time}`;
}

/** The two instants of one occurrence, already resolved. */
export interface ScheduleOccurrence {
  registrationStartAt?: string;
  tournamentStartAt?: string;
}

/** How far back or forward the weekly search looks — a week covers every case,
 *  since that is the period. */
const WEEK_DAYS = 7;

/**
 * How long an occurrence stays the current one after it opens.
 *
 * Without a bound, a schedule with a single weekday would treat last week's
 * evening as current right up to tonight's registration time — the TV would sit
 * on a seven-day-old FINISHED instead of announcing the night to come. A day is
 * the right length: it covers a tournament that runs past midnight, and it is
 * over long before the next week comes round.
 */
const OCCURRENCE_LIFETIME_MS = 24 * 60 * 60_000;

/**
 * The occurrence a weekly schedule is currently on, or the one it is next
 * waiting for; a `once` schedule resolves to itself.
 *
 * The rule is "the most recent occurrence that has opened and not been
 * dismissed, otherwise the next one to come". That single sentence is what makes
 * a weekly schedule behave: tonight's run stays current all evening — including
 * after its structure has run out, so the TV keeps showing the result — and the
 * moment tonight is dismissed, or next week's registration time arrives, the
 * screens move on without anyone touching them.
 */
export function scheduleOccurrence(
  schedule: TournamentSchedule,
  nowMs: number,
): ScheduleOccurrence {
  if (schedule.scheduleRepeat !== 'weekly') {
    return {
      registrationStartAt: schedule.registrationStartAt,
      tournamentStartAt: schedule.tournamentStartAt,
    };
  }

  const days = (schedule.scheduleWeekdays ?? []).filter((d) => d >= 0 && d <= 6);
  if (days.length === 0 || !schedule.startTime) return {};

  const dismissedAt = toEpochMs(schedule.scheduleDismissedAt) ?? -Infinity;
  const openingTime = schedule.registrationTime ?? schedule.startTime;

  // Today first, then backwards: the newest occurrence that has opened, is still
  // within its day, and has outlived the last dismissal is the one in play.
  for (let back = 0; back <= WEEK_DAYS; back++) {
    const occurrence = occurrenceOnDay(schedule, nowMs, -back, days, openingTime);
    if (!occurrence) continue;
    const opensAt = Date.parse(occurrence.registrationStartAt!);
    if (opensAt > nowMs) continue;
    if (nowMs - opensAt >= OCCURRENCE_LIFETIME_MS) break;
    if (opensAt > dismissedAt) return occurrence;
  }

  // Nothing current: announce the next one, so the screens can say it is coming.
  for (let ahead = 0; ahead <= WEEK_DAYS; ahead++) {
    const occurrence = occurrenceOnDay(schedule, nowMs, ahead, days, openingTime);
    if (!occurrence) continue;
    const opensAt = Date.parse(occurrence.registrationStartAt!);
    if (opensAt > nowMs && opensAt > dismissedAt) return occurrence;
  }
  return {};
}

/** The occurrence on the UTC+7 day `offset` days from now, if that day is one of
 *  the schedule's. */
function occurrenceOnDay(
  schedule: TournamentSchedule,
  nowMs: number,
  offset: number,
  days: number[],
  openingTime: string,
): ScheduleOccurrence | null {
  const today = new Date(nowMs + OFFSET_MS);
  const day = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + offset),
  );
  if (!days.includes(day.getUTCDay())) return null;

  const opensAt = instantOnDay(day, openingTime);
  const startsAt = instantOnDay(day, schedule.startTime!);
  if (opensAt == null || startsAt == null) return null;
  return {
    registrationStartAt: new Date(opensAt).toISOString(),
    tournamentStartAt: new Date(startsAt).toISOString(),
  };
}

/** A UTC+7 calendar day plus `HH:mm` as a UTC instant. */
function instantOnDay(day: Date, time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return null;
  return (
    Date.UTC(
      day.getUTCFullYear(),
      day.getUTCMonth(),
      day.getUTCDate(),
      Number(match[1]),
      Number(match[2]),
    ) - OFFSET_MS
  );
}

export function getSchedulePhase(schedule: TournamentSchedule, nowMs: number): SchedulePhase {
  const occurrence = scheduleOccurrence(schedule, nowMs);
  const registrationAt = toEpochMs(occurrence.registrationStartAt);
  const startAt = toEpochMs(occurrence.tournamentStartAt);

  // Checked first so a start time that has already passed wins even if the
  // registration window was never set — the tournament is due either way.
  if (startAt != null && nowMs >= startAt) return 'start-due';
  if (registrationAt != null && nowMs >= registrationAt) return 'registering';
  if (registrationAt != null || startAt != null) return 'waiting';
  return 'unscheduled';
}

/**
 * The registration countdown, or undefined when the tournament isn't in its
 * registration window — so a caller can render the whole registration screen
 * off the presence of this one value.
 */
export function getRegistrationWindow(
  schedule: TournamentSchedule,
  nowMs: number,
): RegistrationWindow | undefined {
  if (getSchedulePhase(schedule, nowMs) !== 'registering') return undefined;

  const occurrence = scheduleOccurrence(schedule, nowMs);
  const startAt = toEpochMs(occurrence.tournamentStartAt);
  if (startAt == null) return { secondsRemaining: null, elapsedFraction: 0 };

  const registrationAt = toEpochMs(occurrence.registrationStartAt) ?? nowMs;
  const total = Math.max(1, startAt - registrationAt);
  const remaining = Math.max(0, startAt - nowMs);
  return {
    // Rounded up, so the last second is shown as 0:01 rather than skipped.
    secondsRemaining: Math.ceil(remaining / 1000),
    elapsedFraction: Math.min(1, Math.max(0, 1 - remaining / total)),
  };
}

/**
 * The rules relating the two fields: the start comes after registration opens,
 * and not more than {@link MAX_REGISTRATION_WINDOW_HOURS} after it.
 *
 * Either field being absent is fine — a tournament may open registration with
 * no fixed start, or be given a start time with no registration window in front
 * of it — and neither case has two times to relate.
 */
export function validateSchedule(
  schedule: TournamentSchedule,
  nowMs?: number,
): string | null {
  if (schedule.scheduleRepeat === 'weekly') return validateWeekly(schedule);

  const registrationAt = toEpochMs(schedule.registrationStartAt);
  const startAt = toEpochMs(schedule.tournamentStartAt);

  if (nowMs != null) {
    const earliest = Math.min(registrationAt ?? Infinity, startAt ?? Infinity);
    if (earliest < nowMs) return 'The schedule cannot start in the past.';
  }

  if (registrationAt == null || startAt == null) return null;

  if (startAt <= registrationAt) {
    return 'Tournament start must be after registration start.';
  }
  if (startAt - registrationAt > MAX_REGISTRATION_WINDOW_MS) {
    return `Tournament start must be within ${MAX_REGISTRATION_WINDOW_HOURS} hours of registration start.`;
  }
  return null;
}

/**
 * A weekly schedule is either off — no days picked — or complete. Half of one is
 * the state worth catching: days chosen with no start time would announce a
 * recurrence that never fires.
 *
 * The two times are read on the same UTC+7 day, which is what lets them be
 * compared as plain `HH:mm` strings and keeps the 16-hour rule meaning what it
 * does for a dated schedule.
 */
function validateWeekly(schedule: TournamentSchedule): string | null {
  const days = schedule.scheduleWeekdays ?? [];
  if (days.length === 0 && !schedule.startTime && !schedule.registrationTime) return null;

  if (days.length === 0) return 'Pick at least one day for a weekly schedule.';
  if (!schedule.startTime) return 'A weekly schedule needs a start time.';
  if (!schedule.registrationTime) return null;

  const opens = minutesOfDay(schedule.registrationTime);
  const starts = minutesOfDay(schedule.startTime);
  if (opens == null || starts == null) return null;

  if (starts <= opens) return 'Tournament start must be after registration start.';
  if (starts - opens > MAX_REGISTRATION_WINDOW_HOURS * 60) {
    return `Tournament start must be within ${MAX_REGISTRATION_WINDOW_HOURS} hours of registration start.`;
  }
  return null;
}

/** `HH:mm` as minutes past midnight, so two times of day compare as numbers. */
function minutesOfDay(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/** An unparseable stored value is treated as absent rather than as epoch zero. */
function toEpochMs(iso: string | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}
