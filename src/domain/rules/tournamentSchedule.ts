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
export const SCHEDULE_TIMEZONE_LABEL = 'UTC+7';

const OFFSET_MS = SCHEDULE_UTC_OFFSET_MINUTES * 60_000;

/**
 * How long registration may stay open before the tournament starts. A window
 * longer than this is a mistyped date rather than a real plan — and it is worth
 * catching at setup, because the projector would otherwise sit on a countdown
 * measured in days.
 */
export const MAX_REGISTRATION_WINDOW_HOURS = 16;

const MAX_REGISTRATION_WINDOW_MS = MAX_REGISTRATION_WINDOW_HOURS * 60 * 60_000;

/** The two instants, as stored on a tournament: UTC ISO 8601, or absent. */
export interface TournamentSchedule {
  registrationStartAt?: string;
  tournamentStartAt?: string;
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

/** A stored instant spelled out for a summary line, offset included so nobody
 *  has to guess which clock it is on. */
export function formatScheduleTime(iso: string | undefined): string {
  const local = scheduleIsoToLocal(iso);
  if (!local) return '';
  const [date, time] = local.split('T');
  return `${date} ${time} ${SCHEDULE_TIMEZONE_LABEL}`;
}

export function getSchedulePhase(schedule: TournamentSchedule, nowMs: number): SchedulePhase {
  const registrationAt = toEpochMs(schedule.registrationStartAt);
  const startAt = toEpochMs(schedule.tournamentStartAt);

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

  const startAt = toEpochMs(schedule.tournamentStartAt);
  if (startAt == null) return { secondsRemaining: null, elapsedFraction: 0 };

  const registrationAt = toEpochMs(schedule.registrationStartAt) ?? nowMs;
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
export function validateSchedule(schedule: TournamentSchedule): string | null {
  const registrationAt = toEpochMs(schedule.registrationStartAt);
  const startAt = toEpochMs(schedule.tournamentStartAt);
  if (registrationAt == null || startAt == null) return null;

  if (startAt <= registrationAt) {
    return 'Tournament start must be after registration start.';
  }
  if (startAt - registrationAt > MAX_REGISTRATION_WINDOW_MS) {
    return `Tournament start must be within ${MAX_REGISTRATION_WINDOW_HOURS} hours of registration start.`;
  }
  return null;
}

/** An unparseable stored value is treated as absent rather than as epoch zero. */
function toEpochMs(iso: string | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}
