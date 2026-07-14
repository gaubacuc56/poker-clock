import type { PayoutResult } from '@domain/entities';
import { formatMoney } from '@domain/rules/format';

interface PayoutTableProps {
  results: PayoutResult[];
}

export default function PayoutTable({ results }: PayoutTableProps) {
  return (
    <table className="w-full text-left" style={{ fontSize: 'clamp(0.8rem, 1.55vw, 3.5rem)' }}>
      <thead className="text-white">
        <tr>
          <th className="px-3 py-1.5 text-center">Place</th>
          <th className="px-3 py-1.5 text-center">Payout</th>
        </tr>
      </thead>
      <tbody>
        {results.map((result) => (
          <tr key={result.position} className="border-t border-slate-800">
            <td className="px-3 py-1.5 text-center">{result.position}</td>
            <td className="px-3 py-1.5 text-center font-bold" >{formatMoney(result.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
