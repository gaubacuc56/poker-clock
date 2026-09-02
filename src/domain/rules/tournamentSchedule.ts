/**
 * When a tournament starts, and when the room starts counting down to it.
 *
 * There is one configurable instant: the start. Everything else is worked out
 * from it — the registration countdown included, which opens itself exactly
 * {@link REGISTRATION_LEAD_HOURS} before the start. Nothing about registration
 * is stored or pressed: a second scheduled time is a second time to keep
 * correct, and a button is a board that only goes up if somebody is there.
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
 * How long before the start the registration countdown runs.
 *
 * It is the whole countdown, full to zero: the doors open exactly this far out
 * and the bar empties as the start arrives. Any longer would not be a countdown
 * — a board measured in days tells the room nothing — so before it the screens
 * announce the session instead.
 */
export const REGISTRATION_LEAD_HOURS = 6;

const REGISTRATION_LEAD_MS = REGISTRATION_LEAD_HOURS * 60 * 60_000;

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
 * When a tournament starts, as stored.
 *
 * Two shapes behind one interface. A `once` schedule names an instant. A
 * `weekly` one names days of the week and a time of day, and the instant is
 * worked out per occurrence — the whole point being that a weekly schedule
 * survives the run it started, so an organiser sets Friday 19:00 once rather
 * than re-entering tomorrow's date every evening.
 *
 * Everything downstream reads only the resolved instant, via
 * {@link scheduleOccurrence}, so the two shapes never have to be handled twice.
 */
export interface TournamentSchedule {
  /** Absent = 'once'. */
  scheduleRepeat?: ScheduleRepeat;

  /** `once`: the instant itself. */
  tournamentStartAt?: string;

  /** `weekly`: which days it fires on (0 = Sunday … 6 = Saturday, in UTC+7). */
  scheduleWeekdays?: number[];
  /** `weekly`: the time of day in UTC+7, `HH:mm`. */
  startTime?: string;

  /**
   * The instant an occurrence was dismissed — Stop, on a weekly schedule.
   *
   * Occurrences that started at or before this are skipped and the next one still
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
  /** Seconds until the scheduled start. */
  secondsRemaining: number;
  /** 0…1 of the {@link REGISTRATION_LEAD_HOURS} already elapsed. */
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

/** The instant of one occurrence, already resolved. */
export interface ScheduleOccurrence {
  tournamentStartAt?: string;
}

/** How far back or forward the weekly search looks — a week covers every case,
 *  since that is the period. */
const WEEK_DAYS = 7;

/**
 * How long an occurrence stays the current one after it starts.
 *
 * Without a bound, a schedule with a single weekday would treat last week's
 * evening as current right up to tonight — the TV would sit on a seven-day-old
 * FINISHED instead of announcing the night to come. A day is the right length:
 * it covers a tournament that runs past midnight, and it is over long before the
 * next week comes round.
 */
const OCCURRENCE_LIFETIME_MS = 24 * 60 * 60_000;

/**
 * The occurrence a weekly schedule is currently on, or the one it is next
 * waiting for; a `once` schedule resolves to itself.
 *
 * The rule is "the most recent occurrence that has started and not been
 * dismissed, otherwise the next one to come". That single sentence is what makes
 * a weekly schedule behave: tonight's run stays current all evening — including
 * after its structure has run out, so the TV keeps showing the result — and the
 * moment tonight is dismissed, or it is over, the screens move on to next week
 * without anyone touching them.
 */
export function scheduleOccurrence(
  schedule: TournamentSchedule,
  nowMs: number,
): ScheduleOccurrence {
  if (schedule.scheduleRepeat !== 'weekly') {
    return { tournamentStartAt: schedule.tournamentStartAt };
  }

  const days = (schedule.scheduleWeekdays ?? []).filter((d) => d >= 0 && d <= 6);
  if (days.length === 0 || !schedule.startTime) return {};

  const dismissedAt = toEpochMs(schedule.scheduleDismissedAt) ?? -Infinity;

  // Today first, then backwards: the newest occurrence that has started, is
  // still within its day, and has outlived the last dismissal is the one in play.
  for (let back = 0; back <= WEEK_DAYS; back++) {
    const startsAt = occurrenceOnDay(schedule, nowMs, -back, days);
    if (startsAt == null) continue;
    if (startsAt > nowMs) continue;
    if (nowMs - startsAt >= OCCURRENCE_LIFETIME_MS) break;
    if (startsAt > dismissedAt) {
      return { tournamentStartAt: new Date(startsAt).toISOString() };
    }
  }

  // Nothing current: announce the next one, so the screens can say it is coming
  // and registration can be opened once it is close enough.
  for (let ahead = 0; ahead <= WEEK_DAYS; ahead++) {
    const startsAt = occurrenceOnDay(schedule, nowMs, ahead, days);
    if (startsAt == null) continue;
    if (startsAt > nowMs && startsAt > dismissedAt) {
      return { tournamentStartAt: new Date(startsAt).toISOString() };
    }
  }
  return {};
}

/** The start instant on the UTC+7 day `offset` days from now, if that day is one
 *  of the schedule's. */
function occurrenceOnDay(
  schedule: TournamentSchedule,
  nowMs: number,
  offset: number,
  days: number[],
): number | null {
  const today = new Date(nowMs + OFFSET_MS);
  const day = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + offset),
  );
  if (!days.includes(day.getUTCDay())) return null;
  return instantOnDay(day, schedule.startTime!);
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

/** One other tournament already set to run alongside a start being scheduled. */
export interface ScheduleClash {
  id: string;
  name: string;
  /** The occurrence of it that falls close, as a stored instant. */
  startsAt: string;
}

/** A tournament as this rule reads it: a schedule with something to call it. */
export type NamedSchedule = TournamentSchedule & { id: string; name: string };

/**
 * The other tournaments already set to run around a start being scheduled,
 * soonest first — what the setup screen says out loud while the organiser is
 * still picking the time.
 *
 * A notice, not a rule: two tournaments may legitimately share an evening, and
 * whether they may actually run at once is the plan's business — `planLimits`
 * answers that when one of them tries to start. What this catches is the
 * schedule nobody remembered setting.
 *
 * "Around" is {@link REGISTRATION_LEAD_HOURS} either side, because that is
 * already the span a tournament occupies a room's screens for: from the moment
 * its board goes up to the moment it starts.
 */
export function findScheduleClashes(
  schedule: TournamentSchedule,
  others: readonly NamedSchedule[],
  nowMs: number,
): ScheduleClash[] {
  const startAt = toEpochMs(scheduleOccurrence(schedule, nowMs).tournamentStartAt);
  if (startAt == null) return [];

  const clashes: ScheduleClash[] = [];
  for (const other of others) {
    // One mention per tournament: a weekly schedule can only put one occurrence
    // in a twelve-hour window anyway, and naming it twice would read as two.
    const [startsAt] = scheduleOccurrencesBetween(
      other,
      startAt - REGISTRATION_LEAD_MS,
      startAt + REGISTRATION_LEAD_MS,
    );
    if (startsAt == null) continue;
    clashes.push({
      id: other.id,
      name: other.name,
      startsAt: new Date(startsAt).toISOString(),
    });
  }
  return clashes.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/**
 * Every instant a schedule fires between two moments.
 *
 * Unlike {@link scheduleOccurrence}, which answers "which one is in play now",
 * this one is asked about a window that has nothing to do with now — the
 * evening the organiser is currently typing into the form. A dated schedule
 * contributes its one instant; a weekly one contributes each of its days that
 * falls inside.
 */
function scheduleOccurrencesBetween(
  schedule: TournamentSchedule,
  fromMs: number,
  toMs: number,
): number[] {
  const dismissedAt = toEpochMs(schedule.scheduleDismissedAt) ?? -Infinity;
  const found: number[] = [];

  if (schedule.scheduleRepeat !== 'weekly') {
    const startsAt = toEpochMs(schedule.tournamentStartAt);
    if (startsAt != null && startsAt >= fromMs && startsAt <= toMs && startsAt > dismissedAt) {
      found.push(startsAt);
    }
    return found;
  }

  const days = (schedule.scheduleWeekdays ?? []).filter((d) => d >= 0 && d <= 6);
  if (days.length === 0 || !schedule.startTime) return found;

  // Walked in UTC+7 calendar days, the terms a weekly schedule is written in.
  // One day past the end covers a window that starts and ends inside the same
  // day as well as one that straddles midnight.
  const first = new Date(fromMs + OFFSET_MS);
  const dayCount = Math.floor((toMs - fromMs) / (24 * 60 * 60_000)) + 2;
  for (let i = 0; i < dayCount; i++) {
    const day = new Date(
      Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), first.getUTCDate() + i),
    );
    if (!days.includes(day.getUTCDay())) continue;
    const startsAt = instantOnDay(day, schedule.startTime);
    if (startsAt == null) continue;
    if (startsAt >= fromMs && startsAt <= toMs && startsAt > dismissedAt) found.push(startsAt);
  }
  return found;
}

/**
 * How long until the countdown starts, in seconds — or null when it is already
 * running, or when there is no start to wait for.
 *
 * Screens use it to say when the board goes up, rather than leaving the operator
 * to work it out from the start time themselves.
 */
export function secondsUntilRegistrationOpens(
  schedule: TournamentSchedule,
  nowMs: number,
): number | null {
  const startAt = toEpochMs(scheduleOccurrence(schedule, nowMs).tournamentStartAt);
  if (startAt == null) return null;
  const opensAt = startAt - REGISTRATION_LEAD_MS;
  return nowMs < opensAt ? Math.ceil((opensAt - nowMs) / 1000) : null;
}

/**
 * Whether the registration countdown for the occurrence in play is running.
 *
 * Nothing is recorded and nothing is cleared: the doors open a fixed lead before
 * the start, so this is a comparison rather than a stored state — which is also
 * what makes a weekly schedule put next week's board up on its own.
 */
function isRegistrationOpen(schedule: TournamentSchedule, nowMs: number): boolean {
  const startAt = toEpochMs(scheduleOccurrence(schedule, nowMs).tournamentStartAt);
  if (startAt == null) return false;
  return nowMs >= startAt - REGISTRATION_LEAD_MS && nowMs < startAt;
}

export function getSchedulePhase(schedule: TournamentSchedule, nowMs: number): SchedulePhase {
  const startAt = toEpochMs(scheduleOccurrence(schedule, nowMs).tournamentStartAt);
  if (startAt == null) return 'unscheduled';

  // Checked first: once the start has arrived the tournament is due, and the
  // countdown that led up to it is over.
  if (nowMs >= startAt) return 'start-due';
  return isRegistrationOpen(schedule, nowMs) ? 'registering' : 'waiting';
}

/**
 * The registration countdown, or undefined when the occurrence in play is not
 * inside its lead window — so a caller can render the whole registration screen
 * off the presence of this one value.
 *
 * The bar is the lead window itself: full when the doors open, empty as the
 * start arrives. Every screen works it out from the same two instants, so a
 * phone opened halfway through shows exactly what the TV is showing.
 */
export function getRegistrationWindow(
  schedule: TournamentSchedule,
  nowMs: number,
): RegistrationWindow | undefined {
  if (getSchedulePhase(schedule, nowMs) !== 'registering') return undefined;

  const startAt = toEpochMs(scheduleOccurrence(schedule, nowMs).tournamentStartAt)!;
  const remaining = Math.max(0, startAt - nowMs);
  return {
    // Rounded up, so the last second is shown as 0:01 rather than skipped.
    secondsRemaining: Math.ceil(remaining / 1000),
    elapsedFraction: Math.min(1, Math.max(0, 1 - remaining / REGISTRATION_LEAD_MS)),
  };
}

/**
 * The rule on the one instant there is: it has not already gone.
 *
 * An absent start is fine — a tournament may have no schedule at all and be
 * started by hand, exactly as before.
 */
export function validateSchedule(
  schedule: TournamentSchedule,
  nowMs?: number,
): string | null {
  if (schedule.scheduleRepeat === 'weekly') return validateWeekly(schedule);

  const startAt = toEpochMs(schedule.tournamentStartAt);
  if (startAt == null) return null;
  if (nowMs != null && startAt < nowMs) return 'The schedule cannot start in the past.';
  return null;
}

/**
 * A weekly schedule is either off — no days picked — or complete. Half of one is
 * the state worth catching: days chosen with no start time would announce a
 * recurrence that never fires, and a time with no days is a recurrence with no
 * occasion.
 */
function validateWeekly(schedule: TournamentSchedule): string | null {
  const days = schedule.scheduleWeekdays ?? [];
  if (days.length === 0 && !schedule.startTime) return null;

  if (days.length === 0) return 'Pick at least one day for a weekly schedule.';
  if (!schedule.startTime) return 'A weekly schedule needs a start time.';
  return null;
}

/** An unparseable stored value is treated as absent rather than as epoch zero. */
function toEpochMs(iso: string | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}
