import type { PayoutTier, PayoutUnit } from '@domain/entities';
import { formatNumber } from '@domain/rules/format';
import { fromCents, toCents } from '@domain/rules/money';
import { getPayoutTotals } from '@domain/rules/payouts';

interface PayoutStructureEditorProps {
  tiers: PayoutTier[];
  unit: PayoutUnit;
  onUnitChange: (unit: PayoutUnit) => void;
  onChange: (tiers: PayoutTier[]) => void;
  currency: string;
  /** The guarantee, in cents — 0/undefined means none set yet. */
  guaranteedPrizePoolCents: number;
}

export default function PayoutStructureEditor({
  tiers,
  unit,
  onUnitChange,
  onChange,
  currency,
  guaranteedPrizePoolCents,
}: PayoutStructureEditorProps) {
  const isAmount = unit === 'amount';
  const { total, target, isValid } = getPayoutTotals(tiers, unit, guaranteedPrizePoolCents);

  function updateTier(index: number, rawInput: number) {
    const value = isAmount ? toCents(rawInput) : rawInput;
    onChange(tiers.map((tier, i) => (i === index ? { ...tier, value } : tier)));
  }

  function addTier() {
    onChange([...tiers, { position: tiers.length + 1, value: 0 }]);
  }

  function removeTier(index: number) {
    onChange(
      tiers
        .filter((_, i) => i !== index)
        .map((tier, i) => ({ ...tier, position: i + 1 })),
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 text-sm">
        <button
          type="button"
          className={unit === 'percentage' ? 'btn-primary flex-1' : 'btn-secondary flex-1'}
          onClick={() => onUnitChange('percentage')}
        >
          %
        </button>
        <button
          type="button"
          className={isAmount ? 'btn-primary flex-1' : 'btn-secondary flex-1'}
          onClick={() => onUnitChange('amount')}
        >
          {currency}
        </button>
      </div>

      {isAmount && guaranteedPrizePoolCents === 0 && (
        <p className="text-sm text-amber-400">
          Set a guaranteed prize pool in the Stack step first — payouts by amount split that
          total.
        </p>
      )}

      <div className="space-y-2">
        {tiers.map((tier, index) => (
          <div key={index} className="flex flex-wrap items-center gap-2">
            <span className="w-10 text-sm text-themed-muted">#{tier.position}</span>
            <input
              type="number"
              className="input min-w-[6rem] flex-1"
              value={isAmount ? fromCents(tier.value) : tier.value}
              onChange={(e) => updateTier(index, Number(e.target.value))}
            />
            <span className="text-sm text-themed-muted">{isAmount ? currency : '%'}</span>
            <button
              type="button"
              className="text-red-400 hover:underline"
              onClick={() => removeTier(index)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="btn-secondary" onClick={addTier}>
        Add place
      </button>
      {total === 0 ? (
        <p className="text-sm text-themed-muted">
          Payouts are optional — leave empty and no payout table is shown. Add places to
          configure one.
        </p>
      ) : (
        <p className={`text-sm ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>
          Total: {isAmount ? `${formatNumber(fromCents(total))} ${currency}` : `${total}%`}
          {!isValid &&
            ` (must equal ${isAmount ? `${formatNumber(fromCents(target))} ${currency}` : '100%'})`}
        </p>
      )}
    </div>
  );
}
