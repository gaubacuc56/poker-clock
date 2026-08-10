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
  insertLevelAt,
  moveLevel,
  removeLevelAt,
  updateLevelAt,
} from '@domain/rules/blindStructureEditor';
import { ChevronDownIcon, ChevronUpIcon, TrashIcon } from '@application/components/ui/icons';
import InsertBar from './sections/InsertBar';
import NumberField from './sections/NumberField';
import TextField from './sections/TextField';

interface BlindLevelsTableProps {
  levels: BlindLevel[];
  editable?: boolean;
  onChange?: (levels: BlindLevel[]) => void;
  activeLevelIndex?: number;
}

/**
 * The blind structure as a stack of cards, read-only or editable.
 *
 * Every edit is a whole new `levels` array produced by `blindStructureEditor` —
 * this component decides which button was pressed, not what a structure is
 * allowed to become, so the same rules apply to the wizard, the control screen
 * and an imported spreadsheet.
 */
export default function BlindLevelsTable({
  levels,
  editable = false,
  onChange,
  activeLevelIndex,
}: BlindLevelsTableProps) {
  function patch(index: number, changes: Partial<BlindLevel>) {
    onChange?.(updateLevelAt(levels, index, changes));
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
                      onClick={() => onChange?.(moveLevel(levels, index, -1))}
                      title="Move up"
                      aria-label="Move up"
                    >
                      <ChevronUpIcon className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-icon btn-quiet"
                      disabled={index === levels.length - 1}
                      onClick={() => onChange?.(moveLevel(levels, index, 1))}
                      title="Move down"
                      aria-label="Move down"
                    >
                      <ChevronDownIcon className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-icon btn-danger-quiet"
                      disabled={levels.length <= 1}
                      onClick={() => onChange?.(removeLevelAt(levels, index))}
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
                          patch(index, { durationSeconds: minutesToSeconds(minutes) })
                        }
                      />
                      <TextField
                        label="Break title"
                        value={level.breakLabel ?? ''}
                        placeholder="1st"
                        onChange={(v) => patch(index, { breakLabel: v })}
                      />
                    </div>
                    <label className="check text-[16px]">
                      <input
                        type="checkbox"
                        checked={level.chipRace ?? false}
                        onChange={(e) => patch(index, { chipRace: e.target.checked })}
                      />
                      <span className="box" />
                      Chip race
                    </label>
                    {level.chipRace && (
                      <TextField
                        label="Chip race title"
                        value={level.chipRaceLabel ?? ''}
                        placeholder="25s off"
                        onChange={(v) => patch(index, { chipRaceLabel: v })}
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
                    onChange={(v) => patch(index, { smallBlind: v })}
                  />
                  <NumberField
                    label="BB"
                    value={level.bigBlind}
                    min={BLIND_INCREMENT}
                    step={BLIND_INCREMENT}
                    onChange={(v) => patch(index, { bigBlind: v })}
                  />
                  <NumberField
                    label="Ante"
                    value={level.ante}
                    min={0}
                    step={BLIND_INCREMENT}
                    onChange={(v) => patch(index, { ante: v })}
                  />
                  <NumberField
                    label="Length (min)"
                    value={secondsToMinutes(level.durationSeconds)}
                    onChange={(minutes) =>
                      patch(index, { durationSeconds: minutesToSeconds(minutes) })
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
                  <span className="text-faint">{secondsToMinutes(level.durationSeconds)} min</span>
                </div>
              )}
            </div>

            {editable && (
              <InsertBar
                onAddLevel={() => onChange?.(insertLevelAt(levels, index + 1, createLevelAfter(level)))}
                onAddBreak={
                  level.isBreak
                    ? undefined
                    : () => onChange?.(insertLevelAt(levels, index + 1, createBreak()))
                }
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
