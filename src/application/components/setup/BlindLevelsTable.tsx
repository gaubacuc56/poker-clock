import { Fragment } from 'react';
import type { BlindLevel } from '@domain/entities';
import { formatNumber } from '@domain/rules/format';
import { formatChipRaceLabel, formatLevelLabel } from '@domain/rules/blindFormat';
import { minutesToSeconds, secondsToMinutes } from '@domain/rules/duration';
import {
  BLIND_INCREMENT,
  DEFAULT_BREAK_DURATION_SECONDS,
  createBreak,
  createLevelAfter,
  renumberLevels,
} from '@domain/rules/blindStructureEditor';
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon } from '../icons';

interface BlindLevelsTableProps {
  levels: BlindLevel[];
  editable?: boolean;
  onChange?: (levels: BlindLevel[]) => void;
  activeLevelIndex?: number;
}

/**
 * One labeled numeric field inside an editable level card. When `allowEmpty` is
 * set, a value of 0 renders as an empty field (with an optional placeholder)
 * rather than a literal "0" — used for optional fields like break length.
 */
function NumberField({
  label,
  value,
  onChange,
  min = 0,
  step,
  allowEmpty = false,
  placeholder,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
  allowEmpty?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="field-label">{label}</span>
      <input
        type="number"
        min={min}
        step={step}
        inputMode="numeric"
        placeholder={placeholder}
        className="input tabular-nums"
        value={allowEmpty && value === 0 ? '' : value}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      />
    </label>
  );
}

/** One labeled text field inside an editable level card. */
function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="field-label">{label}</span>
      <input
        type="text"
        className="input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

/**
 * Slim insertion point between cards — adds a level or break at this exact
 * position. The break button is omitted when `onAddBreak` is not given (e.g.
 * below a break, where a back-to-back break makes no sense).
 */
function InsertBar({
  onAddLevel,
  onAddBreak,
}: {
  onAddLevel: () => void;
  onAddBreak?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 py-[5px]">
      <div className="h-px flex-1 bg-linear-to-r from-transparent via-line to-transparent" />
      <button type="button" className="btn btn-ghost text-[18px]" onClick={onAddLevel}>
        <PlusIcon className="size-[13px]" />
        Level
      </button>
      {onAddBreak && (
        <button
          type="button"
          className="btn btn-ghost text-[18px] text-break hover:bg-break/10"
          onClick={onAddBreak}
        >
          <PlusIcon className="size-[13px]" />
          Break
        </button>
      )}
      <div className="h-px flex-1 bg-linear-to-r from-transparent via-line to-transparent" />
    </div>
  );
}

export default function BlindLevelsTable({
  levels,
  editable = false,
  onChange,
  activeLevelIndex,
}: BlindLevelsTableProps) {
  function updateLevel(index: number, patch: Partial<BlindLevel>) {
    if (!onChange) return;
    onChange(levels.map((level, i) => (i === index ? { ...level, ...patch } : level)));
  }

  function insertAt(position: number, level: BlindLevel) {
    if (!onChange) return;
    const next = [...levels];
    next.splice(position, 0, level);
    onChange(renumberLevels(next));
  }

  function removeLevel(index: number) {
    if (!onChange || levels.length <= 1) return;
    onChange(renumberLevels(levels.filter((_, i) => i !== index)));
  }

  function moveLevel(index: number, direction: -1 | 1) {
    if (!onChange) return;
    const target = index + direction;
    if (target < 0 || target >= levels.length) return;
    const next = [...levels];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(renumberLevels(next));
  }

  return (
    <div className="flex flex-col">
      {levels.map((level, index) => {
        const isActive = index === activeLevelIndex;
        return (
          <Fragment key={index}>
            <div
              className={`flex flex-col gap-2 rounded-[18px] px-3 py-[11px] ring-1 ring-inset ${
                level.isBreak ? 'bg-break/10' : 'bg-surface shadow-lift-sm'
              } ${isActive ? 'ring-accent' : level.isBreak ? 'ring-break/30' : 'ring-transparent'}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`display text-[20px] tracking-[.04em] ${
                    level.isBreak ? 'text-break' : ''
                  }`}
                >
                  {formatLevelLabel(level)}
                </span>

                {editable && (
                  <div className="ml-auto flex gap-0.5">
                    <button
                      type="button"
                      className="btn btn-icon btn-quiet"
                      disabled={index === 0}
                      onClick={() => moveLevel(index, -1)}
                      title="Move up"
                      aria-label="Move up"
                    >
                      <ChevronUpIcon className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-icon btn-quiet"
                      disabled={index === levels.length - 1}
                      onClick={() => moveLevel(index, 1)}
                      title="Move down"
                      aria-label="Move down"
                    >
                      <ChevronDownIcon className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-icon btn-danger-quiet"
                      disabled={levels.length <= 1}
                      onClick={() => removeLevel(index)}
                      title="Remove"
                      aria-label="Remove"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                )}
              </div>

              {level.isBreak ? (
                editable ? (
                  <>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
                      <NumberField
                        label="Length (min)"
                        value={secondsToMinutes(level.durationSeconds)}
                        allowEmpty
                        placeholder={String(secondsToMinutes(DEFAULT_BREAK_DURATION_SECONDS))}
                        onChange={(minutes) =>
                          updateLevel(index, { durationSeconds: minutesToSeconds(minutes) })
                        }
                      />
                      <TextField
                        label="Break title"
                        value={level.breakLabel ?? ''}
                        placeholder="1st"
                        onChange={(v) => updateLevel(index, { breakLabel: v })}
                      />
                    </div>
                    <label className="check text-[16px]">
                      <input
                        type="checkbox"
                        checked={level.chipRace ?? false}
                        onChange={(e) => updateLevel(index, { chipRace: e.target.checked })}
                      />
                      <span className="box" />
                      Chip race
                    </label>
                    {level.chipRace && (
                      <TextField
                        label="Chip race title"
                        value={level.chipRaceLabel ?? ''}
                        placeholder="25s off"
                        onChange={(v) => updateLevel(index, { chipRaceLabel: v })}
                      />
                    )}
                  </>
                ) : (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[16px] text-muted">
                    <span>{secondsToMinutes(level.durationSeconds)} min</span>
                    {level.chipRace && (
                      <span className="text-break">{formatChipRaceLabel(level)}</span>
                    )}
                  </div>
                )
              ) : editable ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <NumberField
                    label="SB"
                    value={level.smallBlind}
                    min={BLIND_INCREMENT}
                    step={BLIND_INCREMENT}
                    onChange={(v) => updateLevel(index, { smallBlind: v })}
                  />
                  <NumberField
                    label="BB"
                    value={level.bigBlind}
                    min={BLIND_INCREMENT}
                    step={BLIND_INCREMENT}
                    onChange={(v) => updateLevel(index, { bigBlind: v })}
                  />
                  <NumberField
                    label="Ante"
                    value={level.ante}
                    min={0}
                    step={BLIND_INCREMENT}
                    onChange={(v) => updateLevel(index, { ante: v })}
                  />
                  <NumberField
                    label="Length (min)"
                    value={secondsToMinutes(level.durationSeconds)}
                    onChange={(minutes) =>
                      updateLevel(index, { durationSeconds: minutesToSeconds(minutes) })
                    }
                  />
                </div>
              ) : (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[16px]">
                  <span>
                    <span className="text-faint">SB </span>
                    {formatNumber(level.smallBlind)}
                  </span>
                  <span>
                    <span className="text-faint">BB </span>
                    {formatNumber(level.bigBlind)}
                  </span>
                  <span>
                    <span className="text-faint">Ante </span>
                    {level.ante ? formatNumber(level.ante) : '-'}
                  </span>
                  <span className="text-faint">
                    {secondsToMinutes(level.durationSeconds)} min
                  </span>
                </div>
              )}
            </div>

            {editable && (
              <InsertBar
                onAddLevel={() => insertAt(index + 1, createLevelAfter(level))}
                onAddBreak={level.isBreak ? undefined : () => insertAt(index + 1, createBreak())}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
