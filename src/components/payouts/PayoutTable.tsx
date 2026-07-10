import type { CurrencyUnit, PayoutResult } from '@domain/entities';
import { formatMoney } from '@domain/rules/format';

interface PayoutTableProps {
  results: PayoutResult[];
  currency: CurrencyUnit;
}

export default function PayoutTable({ results, currency }: PayoutTableProps) {
  return (
    <table className="w-full text-left" style={{ fontSize: 'clamp(0.8rem, 1.1vw, 1.4rem)' }}>
      <thead className="text-white">
        <tr>
          <th className="px-3 py-1.5">Place</th>
          <th className="px-3 py-1.5">Payout</th>
        </tr>
      </thead>
      <tbody>
        {results.map((result) => (
          <tr key={result.position} className="border-t border-slate-800">
            <td className="px-3 py-1.5">#{result.position}</td>
            <td className="px-3 py-1.5">{formatMoney(result.amount, currency)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
