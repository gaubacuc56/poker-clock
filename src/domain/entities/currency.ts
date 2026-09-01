/**
 * A unit a tournament can be priced in.
 *
 * Two kinds share the table. The standard units — VND and USD — have no owner
 * and every account sees the same two. A custom unit belongs to the account that
 * created it and is invisible to everyone else, which is what lets one club have
 * "CHIPS" mean their chips without claiming the name from anybody.
 *
 * `code` is therefore not unique on its own, and `id` is what identifies a row.
 * A tournament still stores the plain code, not the id: what it is priced in has
 * to keep reading correctly even if the unit is later deleted.
 */
export interface Currency {
  id: string;
  /** Uppercase, e.g. `USD`. */
  code: string;
  label: string;
  /** Absent on the standard units — those belong to nobody and cannot be edited. */
  ownerId?: string;
}
