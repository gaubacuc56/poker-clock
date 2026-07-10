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

/** Always have 00:00 format */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

/** Always have 00:00:00 format */
export function formatDurationHMS(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds]
    .map((n) => n.toString().padStart(2, "0"))
    .join(":");
}
