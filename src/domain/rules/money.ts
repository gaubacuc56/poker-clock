/**
 * Every money amount is stored in hundredths of a currency unit (the same
 * "smallest unit" convention as Stripe's cents) — this is the single place
 * that conversion happens, so it never gets reinvented ad hoc at the edges
 * (form inputs, display math) with a stray `* 100` or `/ 100`.
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}
