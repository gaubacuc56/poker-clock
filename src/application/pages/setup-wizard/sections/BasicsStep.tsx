import type { Currency } from '@domain/entities';
import type { TournamentDraft } from '@domain/rules/tournamentDraft';
import { WarningIcon } from '@application/components/ui/icons';
import Field from './Field';
import Switch from './Switch';

interface BasicsStepProps {
  draft: TournamentDraft;
  currencies: Currency[];
  onChange: <K extends keyof TournamentDraft>(key: K, value: TournamentDraft[K]) => void;
}

/** Everything about the tournament that isn't a structure: name, prices, sizes. */
export default function BasicsStep({ draft, currencies, onChange }: BasicsStepProps) {
  const rebuyPriceValid = !draft.allowRebuy || Number(draft.rebuyPrice) > 0;
  const addOnPriceValid = !draft.allowAddOn || Number(draft.addOnPrice) > 0;

  return (
    <>
      {/* One field per row at every width — the basics step reads
          top-to-bottom rather than wrapping into uneven columns. */}
      <div className="grid grid-cols-1 gap-3">
        <Field label="Tournament name">
          <input
            className="input h-[42px] text-[22px] text-fg-strong"
            value={draft.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="Friday Night Poker"
          />
        </Field>
        <Field label="Currency / unit">
          <select
            className="input"
            value={draft.currency}
            onChange={(e) => onChange('currency', e.target.value)}
          >
            {currencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Buy-in">
          <input
            type="number"
            className="input tabular-nums"
            value={draft.buyIn}
            onChange={(e) => onChange('buyIn', e.target.value)}
          />
        </Field>
        <Field label="Fee / rake">
          <input
            type="number"
            className="input tabular-nums"
            value={draft.fee}
            onChange={(e) => onChange('fee', e.target.value)}
          />
        </Field>
        <Field label="Starting stack">
          <input
            type="number"
            className="input tabular-nums"
            value={draft.startingStack}
            onChange={(e) => onChange('startingStack', e.target.value)}
          />
        </Field>
        <Field label="Max players per table">
          <input
            type="number"
            className="input tabular-nums"
            value={draft.maxPlayersPerTable}
            onChange={(e) => onChange('maxPlayersPerTable', e.target.value)}
          />
        </Field>
        <Field label="Late reg closes after level">
          <input
            type="number"
            className="input tabular-nums"
            value={draft.lateRegLevel}
            onChange={(e) => onChange('lateRegLevel', e.target.value)}
          />
        </Field>
        <Field label={`Guaranteed prize pool (${draft.currency}, optional)`}>
          <input
            type="number"
            className="input tabular-nums"
            placeholder="—"
            value={draft.guaranteedPrizePool}
            onChange={(e) => onChange('guaranteedPrizePool', e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <div className="card gap-2.5">
          <Switch
            label="Allow rebuys"
            checked={draft.allowRebuy}
            onChange={(checked) => onChange('allowRebuy', checked)}
          />
          {draft.allowRebuy && (
            <Field label="Rebuy price">
              <input
                type="number"
                className={`input tabular-nums ${rebuyPriceValid ? '' : 'input-bad'}`}
                value={draft.rebuyPrice}
                onChange={(e) => onChange('rebuyPrice', e.target.value)}
              />
            </Field>
          )}
          {!rebuyPriceValid && (
            <p className="flex gap-1.5 text-[18px] text-coral">
              <WarningIcon className="size-[15px] shrink-0" />
              Rebuy price must be greater than 0.
            </p>
          )}
        </div>

        <div className="card gap-2.5">
          <Switch
            label="Allow add-ons"
            checked={draft.allowAddOn}
            onChange={(checked) => onChange('allowAddOn', checked)}
          />
          {draft.allowAddOn && (
            <Field label="Add-on price">
              <input
                type="number"
                className={`input tabular-nums ${addOnPriceValid ? '' : 'input-bad'}`}
                value={draft.addOnPrice}
                onChange={(e) => onChange('addOnPrice', e.target.value)}
              />
            </Field>
          )}
          {!addOnPriceValid && (
            <p className="flex gap-1.5 text-[18px] text-coral">
              <WarningIcon className="size-[15px] shrink-0" />
              Add-on price must be greater than 0.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
