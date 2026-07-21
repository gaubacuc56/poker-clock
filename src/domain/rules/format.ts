import type { CurrencyUnit } from "../entities";
import { fromCents } from "./money";

/**
 * The single place every displayed quantity (chip counts, blinds, stacks,
 * player counts...) gets its thousands separator — always "19,000" style,
 * regardless of the runtime's default locale (a bare `.toLocaleString()`
 * with no locale argument depends on the browser/OS locale and isn't
 * guaranteed to group digits the same way everywhere).
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return value.toLocaleString("en-US", options);
}

/** Plain amount, no currency — for buy-in/fee, which aren't prize pool/payout money. */
export function formatAmount(cents: number): string {
  return formatNumber(fromCents(cents), { maximumFractionDigits: 2 });
}

/** Amount with its currency unit — for prize pool/payout money only. */
export function formatMoney(cents: number, currency?: CurrencyUnit): string {
  if (currency) return `${formatAmount(cents)} ${currency}`;
  return formatAmount(cents);
}

/**
 * Compact chip-count notation for space-constrained displays (the control
 * screen). The thousands group is replaced by "K" and the millions group by
 * "M"; any remaining lower digits are kept after the letter with trailing
 * zeros dropped, so the letter doubles as a decimal-ish separator:
 *
 *   99000    -> "99,000"   (< 6 digits: left as an ordinary grouped number)
 *   100000   -> "100K"
 *   137500   -> "137K5"    (137,500 = 137.5K)
 *   137550   -> "137K55"
 *   100005   -> "100K005"
 *   1000000  -> "1M"
 *   5000000  -> "5M"
 *   1500000  -> "1M5"
 *   1000000000    -> "1B"     (billion, from 10 digits)
 *   2500000000    -> "2B5"
 *   1000000000000 -> "1T"     (trillion, from 13 digits)
 *
 * K covers 6-digit values; each larger suffix takes over at its own group:
 * M at 7 digits (million), B at 10 digits (billion), T at 13 digits (trillion).
 */
export function formatCompactNumber(value: number): string {
  const rounded = Math.round(value);
  const n = Math.abs(rounded);
  if (n < 100_000) return formatNumber(rounded);

  const sign = rounded < 0 ? "-" : "";
  if (n >= 1_000_000_000_000)
    return sign + splitCompact(n, 1_000_000_000_000, 12, "T");
  if (n >= 1_000_000_000)
    return sign + splitCompact(n, 1_000_000_000, 9, "B");
  if (n >= 1_000_000) return sign + splitCompact(n, 1_000_000, 6, "M");
  return sign + splitCompact(n, 1_000, 3, "K");
}

function splitCompact(
  n: number,
  unit: number,
  width: number,
  suffix: string,
): string {
  const whole = Math.floor(n / unit);
  const fraction = (n % unit)
    .toString()
    .padStart(width, "0")
    .replace(/0+$/, "");
  return `${whole}${suffix}${fraction}`;
}

/** Always have 00:00 format */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Always have 00:00:00 format. Uses ceil (like `formatClock`) so this
 * countdown ticks in lockstep with the level clock — they share the same
 * fractional second, and rounding them differently makes the two displays
 * appear to change ~0.5s apart.
 */
export function formatDurationHMS(totalSeconds: number): string {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds]
    .map((n) => n.toString().padStart(2, "0"))
    .join(":");
}
