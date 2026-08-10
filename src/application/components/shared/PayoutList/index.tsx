import type { PayoutResult } from '@domain/entities';
import {
  formatPayoutCash,
  formatPayoutPlace,
  groupPayoutResults,
} from '@domain/rules/payouts';
import { pu } from '@application/shared/projectorScale';

/** The written prize sits beside the cash amount, deliberately smaller and
 *  unbolded so the money stays the thing that reads from across the room. */
const NOTE_SIZE = 1.7;

interface PayoutListProps {
  results: PayoutResult[];
}

/** The projector's prize list: one line per place, reading "1. 50,000 VND" —
 *  the prize (cash, a written note, or both) sits directly after the place, not
 *  pushed to the far edge. Consecutive places that pay the same thing are
 *  collapsed into a single "9 - 12" line upstream. */
export default function PayoutList({ results }: PayoutListProps) {
  const rows = groupPayoutResults(results);
  return (
    <div className="flex flex-col" style={{ fontSize: pu(2.2), gap: pu(0.5) }}>
      {rows.map((row) => {
        const cash = formatPayoutCash(row);
        return (
          <p key={row.from} className="[overflow-wrap:anywhere] text-muted">
            <span className="text-fg-strong tabular-nums">{formatPayoutPlace(row)}.</span>{' '}
            {cash && <span className="display font-bold tabular-nums text-fg">{cash}</span>}
            {row.note && (
              <span className="font-normal" style={{ fontSize: pu(NOTE_SIZE) }}>
                {cash ? ' + ' : ''}
                {row.note}
              </span>
            )}
          </p>
        );
      })}
    </div>
  );
}
