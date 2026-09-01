import { useState } from 'react';
import type { PayoutTier, PayoutUnit } from '@domain/entities';
import { formatNumber } from '@domain/rules/format';
import { fromCents, toCents } from '@domain/rules/money';
import { getPayoutTotals, hasPayouts } from '@domain/rules/payouts';
import ConfirmDialog from '@application/components/ui/ConfirmDialog';
import {
  NoteIcon,
  PlusIcon,
  ResetIcon,
  TrashIcon,
  WarningIcon,
} from '@application/components/ui/icons';

interface PayoutStructureEditorProps {
  tiers: PayoutTier[];
  unit: PayoutUnit;
  onUnitChange: (unit: PayoutUnit) => void;
  onChange: (tiers: PayoutTier[]) => void;
  currency: string;
  guaranteedPrizePoolCents: number;
  onReset?: () => Promise<string | null>;
}

export default function PayoutStructureEditor({
  tiers,
  unit,
  onUnitChange,
  onChange,
  currency,
  guaranteedPrizePoolCents,
  onReset,
}: PayoutStructureEditorProps) {
  const isAmount = unit === 'amount';
  const { total, target, isValid } = getPayoutTotals(tiers, unit, guaranteedPrizePoolCents);
  // Rows whose note field has been opened but is still empty. A row that
  // already has a note shows its field without needing to be listed here.
  const [openNotes, setOpenNotes] = useState<number[]>([]);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

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


  async function confirmReset() {
    setIsResetting(true);
    setResetError(null);
    const failure = onReset ? await onReset() : null;
    setIsResetting(false);
    if (failure) {
      setResetError(failure);
      return;
    }
    onChange([]);
    onUnitChange('percentage');
    setOpenNotes([]);
    setConfirmingReset(false);
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
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="seg">
          <button
            type="button"
            className="seg-opt"
            aria-pressed={!isAmount}
            onClick={() => onUnitChange('percentage')}
          >
            %
          </button>
          <button
            type="button"
            className="seg-opt"
            aria-pressed={isAmount}
            onClick={() => onUnitChange('amount')}
          >
            {currency}
          </button>
        </div>
        {/* Narrow screens put the two actions on their own row under the unit
            toggle, rather than squeezing three controls onto one line. */}
        <div className="flex w-full gap-2.5 sm:ml-auto sm:w-auto">
          {/* Only offered while there is something to reset. */}
          {tiers.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary flex-1 sm:flex-none"
              onClick={() => {
                setResetError(null);
                setConfirmingReset(true);
              }}
            >
              <ResetIcon className="size-[17px]" />
              Reset
            </button>
          )}
          <button type="button" className="btn btn-primary flex-1 sm:flex-none" onClick={addTier}>
            <PlusIcon className="size-[17px]" />
            Add place
          </button>
        </div>
      </div>

      {isAmount && guaranteedPrizePoolCents === 0 && (
        <p className="flex gap-[7px] rounded-2xl bg-break/10 px-[11px] py-[9px] text-[18px] text-break">
          <WarningIcon className="size-4 shrink-0" />
          No guaranteed prize pool is set. Set one on the Stack step to enter payouts as amounts.
        </p>
      )}

      {tiers.map((tier, index) => {
        const noteOpen = isNoteOpen(index);
        return (
          <div
            key={index}
            className="flex flex-col gap-1.5 rounded-2xl bg-surface-2 px-2.5 py-[9px] shadow-lift-sm"
          >
            <div className="flex items-center gap-2">
              <span className="w-[34px] text-[20px] tabular-nums text-muted">
                #{tier.position}
              </span>
              <input
                type="number"
                className="input min-w-0 flex-1 tabular-nums"
                aria-label={`Prize for place ${tier.position}`}
                value={isAmount ? fromCents(tier.value) : tier.value}
                onChange={(e) => updateTier(index, Number(e.target.value))}
              />
              <span className="w-[38px] text-[18px] text-faint">
                {isAmount ? currency : '%'}
              </span>
              <button
                type="button"
                className={`btn btn-icon ${
                  noteOpen ? 'text-accent-lift' : 'text-faint'
                }`}
                onClick={() => toggleNote(index)}
                aria-expanded={noteOpen}
                title={noteOpen ? 'Remove note' : 'Add a note'}
                aria-label={noteOpen ? 'Remove note' : 'Add a note'}
              >
                <NoteIcon className="size-[17px]" />
              </button>
              <button
                type="button"
                className="btn btn-icon btn-danger-quiet"
                onClick={() => removeTier(index)}
                title="Remove place"
                aria-label="Remove place"
              >
                <TrashIcon className="size-[17px]" />
              </button>
            </div>

            {noteOpen && (
              <input
                type="text"
                className="input text-[20px]"
                placeholder="1 ticket happy hour"
                aria-label={`Written prize for place ${tier.position}`}
                value={tier.note ?? ''}
                onChange={(e) => updateNote(index, e.target.value)}
                autoFocus={tier.note === undefined}
              />
            )}
          </div>
        );
      })}

      {!hasPayouts(tiers) ? (
        <p className="text-[18px] text-faint">
          Payouts are optional — leave empty and no payout table is shown.
        </p>
      ) : total === 0 ? (
        <p className="text-[18px] text-faint">Every place pays a written prize only.</p>
      ) : (
        <p
          className={`rounded-2xl px-2.5 py-2 text-[18px] ${
            isValid
              ? 'bg-accent/15 text-accent-lift'
              : 'bg-break/10 text-break-text'
          }`}
        >
          Total: {isAmount ? `${formatNumber(fromCents(total))} ${currency}` : `${total}%`}
          {!isValid &&
            ` — does not match ${
              isAmount ? `${formatNumber(fromCents(target))} ${currency}` : '100%'
            }`}
        </p>
      )}

      {resetError && (
        <p className="flex items-center gap-1.5 text-[18px] text-coral">
          <WarningIcon className="size-[15px] shrink-0" />
          {resetError}
        </p>
      )}

      <ConfirmDialog
        open={confirmingReset}
        title="Reset payouts?"
        message="Every place, prize and note is removed and the change is saved straight away. The rest of the tournament is left alone."
        confirmLabel="Reset"
        isBusy={isResetting}
        onConfirm={confirmReset}
        onCancel={() => setConfirmingReset(false)}
      />
    </div>
  );
}
