import { format, parse } from 'date-fns';

/**
 * Formats the schedule pickers are driven by. Both are the app's own, never the
 * device's: `dd/MM/yyyy` and 24-hour `HH:mm` wherever a schedule is read or
 * written, so a projector, a phone and a laptop on three different locales all
 * say the same thing.
 */
export const DATE_FORMAT = 'dd/MM/yyyy';
export const TIME_FORMAT = 'HH:mm';
export const DATE_TIME_FORMAT = `${DATE_FORMAT} ${TIME_FORMAT}`;

/** How the draft stores a scheduled moment: UTC+7 wall time, no offset. */
const VALUE_FORMAT = "yyyy-MM-dd'T'HH:mm";

/**
 * A stored moment as the `Date` a picker needs.
 *
 * The stored string is UTC+7 wall time, and the `Date` is built from those
 * components in the browser's own timezone — deliberately not converted. The
 * picker only ever shows and edits the numbers; treating them as local keeps the
 * wall clock intact on a device set to any timezone, which a conversion would
 * quietly shift by hours.
 */
export function valueToDate(value: string): Date | null {
  if (!value) return null;
  const parsed = parse(value, VALUE_FORMAT, new Date());
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** The inverse: a picked `Date` back to the stored wall-clock string. */
export function dateToValue(date: Date | null): string {
  return date ? format(date, VALUE_FORMAT) : '';
}

/** A `HH:mm` time of day as the `Date` a time-only picker needs; the date part
 *  is arbitrary and never read back. */
export function timeToDate(time: string): Date | null {
  if (!time) return null;
  const parsed = parse(time, TIME_FORMAT, new Date());
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** The inverse, in 24-hour form whatever the device's locale prefers. */
export function dateToTime(date: Date | null): string {
  return date ? format(date, TIME_FORMAT) : '';
}
