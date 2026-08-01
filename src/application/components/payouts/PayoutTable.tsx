import type { PayoutResult } from '@domain/entities';
import {
  formatPayoutPlace,
  formatPayoutPrize,
  groupPayoutResults,
} from '@domain/rules/payouts';
import { pu } from '../../shared/projectorScale';

interface PayoutTableProps {
  results: PayoutResult[];
}

export default function PayoutTable({ results }: PayoutTableProps) {
  const rows = groupPayoutResults(results);
  const cellPadding = { paddingInline: pu(0.6) };
  return (
    <table className="w-full text-left" style={{ fontSize: pu(2.2) }}>
      <thead className="text-white">
        <tr>
          <th className="text-center" style={cellPadding}>Place</th>
          <th className="text-center" style={cellPadding}>Payout</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.from} className="border-t border-slate-800">
            <td className="whitespace-nowrap text-center" style={cellPadding}>
              {formatPayoutPlace(row)}
            </td>
            <td
              className="text-center font-bold [overflow-wrap:anywhere]"
              style={cellPadding}
            >
              {formatPayoutPrize(row)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
