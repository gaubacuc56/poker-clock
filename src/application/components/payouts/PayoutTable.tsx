import type { PayoutResult } from '@domain/entities';
import { formatMoney } from '@domain/rules/format';

interface PayoutTableProps {
  results: PayoutResult[];
}

interface PayoutRow {
  from: number;
  to: number;
  amount: number;
}

/** Collapse consecutive positions that pay the same amount into a single row
 *  (e.g. positions 9–12 with equal payouts become one "9 - 12" line). */
function groupResults(results: PayoutResult[]): PayoutRow[] {
  const rows: PayoutRow[] = [];
  for (const result of results) {
    const last = rows[rows.length - 1];
    if (last && last.amount === result.amount && result.position === last.to + 1) {
      last.to = result.position;
    } else {
      rows.push({ from: result.position, to: result.position, amount: result.amount });
    }
  }
  return rows;
}

export default function PayoutTable({ results }: PayoutTableProps) {
  const rows = groupResults(results);
  return (
    <table className="w-full text-left" style={{ fontSize: 'clamp(0.8rem, 1.8vw, 3.5rem)' }}>
      <thead className="text-white">
        <tr>
          <th className="px-3 text-center">Place</th>
          <th className="px-3 text-center">Payout</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.from} className="border-t border-slate-800">
            <td className="px-3 text-center">
              {row.from === row.to ? row.from : `${row.from} - ${row.to}`}
            </td>
            <td className="px-3 text-center font-bold">{formatMoney(row.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
