import type { Currency } from '../entities';

/**
 * Custom units, as the account types them.
 *
 * A unit is one word a whole room reads off a projector at ten metres, so it is
 * kept to a short run of letters and digits in one case — and that one word is
 * the whole thing. There is no separate display name to fill in: a unit named
 * CHIPS has nothing a longer label would add, and two fields where one will do
 * is two chances to make them disagree.
 *
 * Uppercasing is done on the way in rather than validated on the way out: an
 * organiser typing "chips" means CHIPS, and refusing them over the shift key
 * would be pedantry.
 */

export const UNIT_CODE_MAX_LENGTH = 8;

const UNIT_CODE_PATTERN = /^[A-Z0-9]+$/;

/** What the account typed, as the code that would actually be stored. */
export function normalizeUnitCode(input: string): string {
  return input.trim().toUpperCase().slice(0, UNIT_CODE_MAX_LENGTH);
}

/**
 * Why this code can't be added, or null when it can.
 *
 * `existing` is the list the account can see — its own units and the standard
 * ones — because both are reasons to refuse, for different reasons: a duplicate
 * of its own is pointless, and shadowing USD would make the same three letters
 * mean two things on two screens in the same room.
 */
export function validateUnitCode(input: string, existing: readonly Currency[]): string | null {
  const code = normalizeUnitCode(input);
  if (!code) return 'Enter a unit name.';
  if (!UNIT_CODE_PATTERN.test(code)) return 'Use letters and digits only.';

  const clash = existing.find((currency) => currency.code === code);
  if (!clash) return null;
  return clash.ownerId
    ? `You already have a unit called ${code}.`
    : `${code} is a standard unit.`;
}

/**
 * The standard units first, then the account's own, each alphabetical.
 *
 * The two groups are kept apart because they behave differently — only the
 * second can be deleted — and a picker that interleaves them makes that look
 * arbitrary.
 */
export function sortUnits(currencies: readonly Currency[]): Currency[] {
  return [...currencies].sort((a, b) => {
    const own = Number(Boolean(a.ownerId)) - Number(Boolean(b.ownerId));
    return own !== 0 ? own : a.code.localeCompare(b.code);
  });
}
