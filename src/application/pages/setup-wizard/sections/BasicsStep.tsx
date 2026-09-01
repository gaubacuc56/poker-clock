import type { Currency } from '@domain/entities';
import type { TournamentDraft } from '@domain/rules/tournamentDraft';
import {
  REGISTRATION_LEAD_HOURS,
  scheduleLocalToIso,
  validateSchedule,
  WEEKDAY_LABELS,
  type ScheduleRepeat,
} from '@domain/rules/tournamentSchedule';
import { WarningIcon } from '@application/components/ui/icons';
import DateTimeField from './DateTimeField';
import Field from './Field';
import TimeField from './TimeField';
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
  const scheduleError = validateSchedule(
    {
      scheduleRepeat: draft.scheduleRepeat,
      tournamentStartAt: scheduleLocalToIso(draft.tournamentStart),
      scheduleWeekdays: draft.scheduleWeekdays,
      startTime: draft.startTime,
    },
    scheduleLocked ? undefined : Date.now(),
  );

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
              <option key={currency.id} value={currency.code}>
                {currency.code}
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
        <Field label={`Guaranteed prize pool`}>
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
        <Field label="Schedule">
          <select
            className="input"
            value={draft.scheduleRepeat}
            onChange={(e) => onChange('scheduleRepeat', e.target.value as ScheduleRepeat)}
          >
            <option value="once">Once</option>
            <option value="weekly">Weekdays</option>
          </select>
        </Field>

        {draft.scheduleRepeat === 'once' ? (
          <>
            <DateTimeField
              label="Tournament start"
              value={draft.tournamentStart}
              disabled={scheduleLocked}
              invalid={Boolean(scheduleError)}
              onChange={(value) => onChange('tournamentStart', value)}
            />
            {scheduleLocked && (
              <p className="text-[16px] text-muted">
                The tournament has already started. Stop it to schedule another run.
              </p>
            )}
          </>
        ) : (
          <>
            {/* Days as toggles rather than a list: an alarm is set by tapping the
                days you mean, and the whole week has to be visible at once. */}
            <div>
              <span className="field-label">Days</span>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAY_LABELS.map((label, day) => {
                  const on = draft.scheduleWeekdays.includes(day);
                  return (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={on}
                      className={`btn h-10 px-3.5 text-[17px] ${
                        on ? 'btn-primary' : 'btn-secondary'
                      }`}
                      onClick={() =>
                        onChange(
                          'scheduleWeekdays',
                          on
                            ? draft.scheduleWeekdays.filter((d) => d !== day)
                            : [...draft.scheduleWeekdays, day],
                        )
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="max-w-[12rem] min-w-0">
              <span className="mb-1 block text-[15px] text-faint">Start</span>
              <TimeField
                value={draft.startTime}
                ariaLabel="Weekly start time"
                invalid={Boolean(scheduleError)}
                onChange={(value) => onChange('startTime', value)}
              />
            </div>
          </>
        )}

        {scheduleError && (
          <p className="flex items-center gap-1.5 text-[18px] text-coral">
            <WarningIcon className="size-[15px] shrink-0" />
            {scheduleError}
          </p>
        )}

        <p className="text-[16px] text-muted">
          Registration is available {REGISTRATION_LEAD_HOURS}  hours before the tournament start.
        </p>
      </div>

    
      <div className="card mt-4 gap-2.5">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="field-label">Reg end</span>
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
            <div className="min-w-0">
              <span className="mb-1 block text-[15px] text-faint">Time of day</span>
              <TimeField
                value={draft.regEndTime}
                ariaLabel="Reg end time of day"
                onChange={(value) => onChange('regEndTime', value)}
              />
            </div>
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
