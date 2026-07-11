import { Fragment } from 'react';
import type { BlindLevel } from '@domain/entities';
import { formatNumber } from '@domain/rules/format';
import { formatLevelLabel } from '@domain/rules/blindFormat';
import { minutesToSeconds, secondsToMinutes } from '@domain/rules/duration';
import {
  BLIND_INCREMENT,
  createBreak,
  createLevelAfter,
  renumberLevels,
} from '@domain/rules/blindStructureEditor';
import { ChevronDownIcon, ChevronUpIcon, PauseIcon, TrashIcon } from '../icons';

interface BlindLevelsTableProps {
  levels: BlindLevel[];
  editable?: boolean;
  onChange?: (levels: BlindLevel[]) => void;
  activeLevelIndex?: number;
}

/** One labeled numeric field inside an editable level card. */
function NumberField({
  label,
  value,
  onChange,
  min = 0,
  step,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-themed-muted">{label}</span>
      <input
        type="number"
        min={min}
        step={step}
        inputMode="numeric"
        className="w-full rounded-md bg-themed-tertiary px-3 py-2 text-sm tabular-nums"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

/** Slim insertion point between cards — adds a level or break at this exact position. */
function InsertBar({
  onAddLevel,
  onAddBreak,
}: {
  onAddLevel: () => void;
  onAddBreak: () => void;
}) {
  return (
    <div className="group flex items-center gap-2 py-0.5">
      <div className="h-px flex-1 bg-themed opacity-60" />
      <button
        type="button"
        className="rounded-md px-2 py-0.5 text-xs font-medium text-themed-muted transition-colors hover:bg-accent/15 hover:text-accent"
        onClick={onAddLevel}
      >
        + Level
      </button>
      <button
        type="button"
        className="rounded-md px-2 py-0.5 text-xs font-medium text-themed-muted transition-colors hover:bg-amber-500/15 hover:text-amber-400"
        onClick={onAddBreak}
      >
        + Break
      </button>
      <div className="h-px flex-1 bg-themed opacity-60" />
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
    <div className="space-y-1">
      {levels.map((level, index) => {
        const isActive = index === activeLevelIndex;
        return (
          <Fragment key={index}>
            <div
              className={`rounded-lg border px-4 py-3 ${
                isActive ? 'border-accent bg-accent/10' : 'border-themed bg-themed-secondary/40'
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
                    level.isBreak ? 'text-amber-400' : 'text-themed-primary'
                  }`}
                >
                  {level.isBreak && <PauseIcon className="h-4 w-4" />}
                  {formatLevelLabel(level)}
                </span>

                {editable && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="btn-ghost rounded-md p-1.5 disabled:opacity-30"
                      disabled={index === 0}
                      onClick={() => moveLevel(index, -1)}
                      title="Move up"
                      aria-label="Move up"
                    >
                      <ChevronUpIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="btn-ghost rounded-md p-1.5 disabled:opacity-30"
                      disabled={index === levels.length - 1}
                      onClick={() => moveLevel(index, 1)}
                      title="Move down"
                      aria-label="Move down"
                    >
                      <ChevronDownIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-red-400 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-30"
                      disabled={levels.length <= 1}
                      onClick={() => removeLevel(index)}
                      title="Remove"
                      aria-label="Remove"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {level.isBreak ? (
                editable ? (
                  <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                    <div className="max-w-[10rem]">
                      <NumberField
                        label="Length (min)"
                        value={secondsToMinutes(level.durationSeconds)}
                        onChange={(minutes) => updateLevel(index, { durationSeconds: minutesToSeconds(minutes) })}
                      />
                    </div>
                    <label className="flex items-center gap-2 py-2 text-sm text-themed-primary">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-accent"
                        checked={level.chipRace ?? false}
                        onChange={(e) => updateLevel(index, { chipRace: e.target.checked })}
                      />
                      Chip Race
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span className="text-themed-muted">
                      {secondsToMinutes(level.durationSeconds)} min
                    </span>
                    {level.chipRace && <span className="text-amber-400">Chip Race</span>}
                  </div>
                )
              ) : editable ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                    onChange={(minutes) => updateLevel(index, { durationSeconds: minutesToSeconds(minutes) })}
                  />
                </div>
              ) : (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span>
                    <span className="text-themed-muted">SB </span>
                    {formatNumber(level.smallBlind)}
                  </span>
                  <span>
                    <span className="text-themed-muted">BB </span>
                    {formatNumber(level.bigBlind)}
                  </span>
                  <span>
                    <span className="text-themed-muted">Ante </span>
                    {level.ante ? formatNumber(level.ante) : '-'}
                  </span>
                  <span className="text-themed-muted">
                    {secondsToMinutes(level.durationSeconds)} min
                  </span>
                </div>
              )}
            </div>

            {editable && (
              <InsertBar
                onAddLevel={() => insertAt(index + 1, createLevelAfter(level))}
                onAddBreak={() => insertAt(index + 1, createBreak())}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
