import type { Currency } from '@domain/entities';
import type { TournamentDraft } from '@domain/rules/tournamentDraft';
import {
  scheduleLocalToIso,
  scheduleNowLocal,
  validateSchedule,
} from '@domain/rules/tournamentSchedule';
import { WarningIcon } from '@application/components/ui/icons';
import Field from './Field';
import Switch from './Switch';

interface BasicsStepProps {
  draft: TournamentDraft;
  currencies: Currency[];
  /** The clock has already been started — the schedule that led up to it is
   *  history and can no longer be rewritten. */
  scheduleLocked?: boolean;
  onChange: <K extends keyof TournamentDraft>(key: K, value: TournamentDraft[K]) => void;
}

/** Everything about the tournament that isn't a structure: name, prices, sizes. */
export default function BasicsStep({
  draft,
  currencies,
  scheduleLocked = false,
  onChange,
}: BasicsStepProps) {
  const rebuyPriceValid = !draft.allowRebuy || Number(draft.rebuyPrice) > 0;
  const addOnPriceValid = !draft.allowAddOn || Number(draft.addOnPrice) > 0;
  const scheduleError = validateSchedule({
    registrationStartAt: scheduleLocalToIso(draft.registrationStart),
    tournamentStartAt: scheduleLocalToIso(draft.tournamentStart),
  });

  // Neither picker offers a moment that has already gone, and the start can't be
  // offered before the registration it has to follow. Both are UTC+7 wall-time
  // strings in the input's own format, so they order as plain strings.
  const earliest = scheduleNowLocal(Date.now());
  const earliestStart =
    draft.registrationStart > earliest ? draft.registrationStart : earliest;

  const regEndFilled = Boolean(draft.lateRegLevel || draft.regEndTime);

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

      <div className="card mt-4 gap-2.5">
        <Field label="Registration start">
          <input
            type="datetime-local"
            className={`input tabular-nums ${scheduleError ? 'input-bad' : ''}`}
            min={earliest}
            disabled={scheduleLocked}
            value={draft.registrationStart}
            onChange={(e) => onChange('registrationStart', e.target.value)}
          />
        </Field>
        <Field label="Tournament start">
          <input
            type="datetime-local"
            className={`input tabular-nums ${scheduleError ? 'input-bad' : ''}`}
            min={earliestStart}
            disabled={scheduleLocked}
            value={draft.tournamentStart}
            onChange={(e) => onChange('tournamentStart', e.target.value)}
          />
        </Field>
        {scheduleLocked && (
          <p className="text-[16px] text-muted">
            The tournament has already started.
            Stop it to schedule another run.
          </p>
        )}
        {scheduleError && (
          <p className="flex gap-1.5 text-[18px] text-coral">
            <WarningIcon className="size-[15px] shrink-0" />
            {scheduleError}
          </p>
        )}
      </div>

      {/* One heading over both halves: the level and the time are two readings
          of the same moment, not two settings. The level is the same number the
          app closes late registration on, so the sign on the TV and the rule it
          enforces cannot disagree. */}
      <div className="card mt-4 gap-2.5">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="field-label">Reg end</span>
            {/* Both halves are optional, and a time input has no way to be
                emptied from its own picker — so clearing them is offered here,
                and only while there is something to clear. */}
            {regEndFilled && (
              <button
                type="button"
                className="btn btn-quiet mb-1 px-2 py-0.5 text-[16px]"
                onClick={() => {
                  onChange('lateRegLevel', '');
                  onChange('regEndTime', '');
                }}
              >
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block min-w-0">
              <span className="mb-1 block text-[15px] text-faint">Level</span>
              {/* Digits only, filtered on the way in rather than left to the
                  browser: a number input silently reports "" for something like
                  "1e", which would wipe the field as the organiser typed. */}
              <input
                type="text"
                inputMode="numeric"
                className="input tabular-nums"
                placeholder="8"
                value={draft.lateRegLevel}
                onChange={(e) => onChange('lateRegLevel', e.target.value.replace(/\D/g, ''))}
              />
            </label>
            <label className="block min-w-0">
              <span className="mb-1 block text-[15px] text-faint">Time of day</span>
              <input
                type="time"
                className="input tabular-nums"
                value={draft.regEndTime}
                onChange={(e) => onChange('regEndTime', e.target.value)}
              />
            </label>
          </div>
        </div>
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
