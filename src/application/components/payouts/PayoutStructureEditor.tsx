import { useState } from 'react';
import type { PayoutTier, PayoutUnit } from '@domain/entities';
import { formatNumber } from '@domain/rules/format';
import { fromCents, toCents } from '@domain/rules/money';
import { getPayoutTotals, hasPayouts } from '@domain/rules/payouts';
import { NoteIcon, PlusIcon, TrashIcon } from '../icons';

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
  // Rows whose note field has been opened but is still empty. A row that
  // already has a note shows its field without needing to be listed here.
  const [openNotes, setOpenNotes] = useState<number[]>([]);

  function isNoteOpen(index: number) {
    return openNotes.includes(index) || tiers[index].note !== undefined;
  }

  /** Closing a row discards whatever note it held — the field is the note. */
  function toggleNote(index: number) {
    if (isNoteOpen(index)) {
      setOpenNotes((open) => open.filter((i) => i !== index));
      if (tiers[index].note !== undefined) updateNote(index, '');
    } else {
      setOpenNotes((open) => [...open, index]);
    }
  }

  function updateTier(index: number, rawInput: number) {
    const value = isAmount ? toCents(rawInput) : rawInput;
    onChange(tiers.map((tier, i) => (i === index ? { ...tier, value } : tier)));
  }

  function updateNote(index: number, note: string) {
    onChange(
      tiers.map((tier, i) =>
        // Store an empty note as absent, so a cleared field doesn't count as a
        // prize and doesn't get rendered as a blank line on the projector.
        i === index ? { ...tier, note: note || undefined } : tier,
      ),
    );
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
    // Open rows are tracked by index, so everything after the removed row
    // shifts down one.
    setOpenNotes((open) =>
      open.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)),
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

      <div className="space-y-1.5">
        {tiers.map((tier, index) => {
          const noteOpen = isNoteOpen(index);
          return (
            <div
              key={index}
              className="rounded-lg border border-themed bg-themed-secondary/40 px-3 py-2"
            >
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-2">
                <span className="w-10 text-sm text-themed-muted">#{tier.position}</span>
                <input
                  type="number"
                  className="input min-w-[6rem]"
                  value={isAmount ? fromCents(tier.value) : tier.value}
                  onChange={(e) => updateTier(index, Number(e.target.value))}
                />
                <span className="text-sm text-themed-muted">{isAmount ? currency : '%'}</span>
                <button
                  type="button"
                  className={`rounded-md p-1.5 ${noteOpen ? 'bg-accent/15 text-accent' : 'btn-ghost'}`}
                  onClick={() => toggleNote(index)}
                  aria-expanded={noteOpen}
                  title={noteOpen ? 'Remove note' : 'Add a note'}
                  aria-label={noteOpen ? 'Remove note' : 'Add a note'}
                >
                  <NoteIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded-md p-1.5 text-red-400 hover:bg-red-500/15"
                  onClick={() => removeTier(index)}
                  title="Remove place"
                  aria-label="Remove place"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>

                {noteOpen && (
                  <input
                    type="text"
                    className="input col-start-2 text-sm"
                    placeholder="e.g. 1 ticket happy hour"
                    value={tier.note ?? ''}
                    onChange={(e) => updateNote(index, e.target.value)}
                    autoFocus={tier.note === undefined}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <button type="button" className="btn-secondary w-full" onClick={addTier}>
        <PlusIcon className="h-4 w-4" />
        Add place
      </button>
      {!hasPayouts(tiers) ? (
        <p className="text-sm text-themed-muted">
          Payouts are optional — leave empty and no payout table is shown. Add places to
          configure one.
        </p>
      ) : total === 0 ? (
        <p className="text-sm text-themed-muted">
          Every place pays a written prize only.
        </p>
      ) : (
        <p className={`text-sm ${isValid ? 'text-emerald-400' : 'text-amber-400'}`}>
          Total: {isAmount ? `${formatNumber(fromCents(total))} ${currency}` : `${total}%`}
          {!isValid &&
            ` (guarantee: ${
              isAmount ? `${formatNumber(fromCents(target))} ${currency}` : '100%'
            })`}
        </p>
      )}
    </div>
  );
}
