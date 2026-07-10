import type { BlindLevel } from '@domain/entities';
import { formatNumber } from '@domain/rules/format';

interface BlindLevelsTableProps {
  levels: BlindLevel[];
  editable?: boolean;
  onChange?: (levels: BlindLevel[]) => void;
  activeLevelIndex?: number;
}

function renumber(levels: BlindLevel[]): BlindLevel[] {
  return levels.map((level, index) => ({ ...level, level: index + 1 }));
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

  function addLevel(index: number) {
    if (!onChange) return;
    const reference = levels[index] ?? levels[levels.length - 1];
    const bigBlind = reference?.bigBlind ?? 50;
    const newLevel: BlindLevel = {
      level: 0,
      smallBlind: reference?.smallBlind ?? 25,
      bigBlind,
      ante: bigBlind,
      isBigBlindAnte: reference?.isBigBlindAnte ?? false,
      durationSeconds: reference?.durationSeconds ?? 20 * 60,
      isBreak: false,
    };
    const next = [...levels];
    next.splice(index + 1, 0, newLevel);
    onChange(renumber(next));
  }

  function addBreak(index: number) {
    if (!onChange) return;
    const breakLevel: BlindLevel = {
      level: 0,
      smallBlind: 0,
      bigBlind: 0,
      ante: 0,
      isBigBlindAnte: false,
      durationSeconds: 10 * 60,
      isBreak: true,
      breakLabel: 'Break',
    };
    const next = [...levels];
    next.splice(index + 1, 0, breakLevel);
    onChange(renumber(next));
  }

  function removeLevel(index: number) {
    if (!onChange || levels.length <= 1) return;
    onChange(renumber(levels.filter((_, i) => i !== index)));
  }

  return (
    <div className="max-h-[32rem] overflow-auto rounded-md border border-themed">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-themed-tertiary text-themed-muted">
          <tr>
            <th className="px-1.5 py-2.5 sm:px-3 sm:py-3">Lvl</th>
            <th className="px-1.5 py-2.5 sm:px-3 sm:py-3">Small</th>
            <th className="px-1.5 py-2.5 sm:px-3 sm:py-3">Big</th>
            <th className="px-1.5 py-2.5 sm:px-3 sm:py-3">Ante</th>
            <th className="px-1.5 py-2.5 sm:px-3 sm:py-3">Min</th>
            {editable && <th className="px-1.5 py-2.5 sm:px-3 sm:py-3" />}
          </tr>
        </thead>
        <tbody>
          {levels.map((level, index) => (
            <tr
              key={index}
              className={`border-t border-themed ${
                index === activeLevelIndex ? 'bg-accent/20' : ''
              } ${level.isBreak ? 'italic text-themed-muted' : ''}`}
            >
              <td className="px-1.5 py-2 sm:px-3">{level.level}</td>
              {level.isBreak ? (
                <td className="px-1.5 py-2 sm:px-3" colSpan={3}>
                  {level.breakLabel ?? 'Break'}
                </td>
              ) : editable ? (
                <>
                  <td className="px-1.5 py-2 sm:px-3">
                    <input
                      type="number"
                      className="w-12 rounded bg-themed-tertiary px-1 py-1.5 sm:w-16 sm:px-1.5"
                      value={level.smallBlind}
                      onChange={(e) =>
                        updateLevel(index, { smallBlind: Number(e.target.value) })
                      }
                    />
                  </td>
                  <td className="px-1.5 py-2 sm:px-3">
                    <input
                      type="number"
                      className="w-12 rounded bg-themed-tertiary px-1 py-1.5 sm:w-16 sm:px-1.5"
                      value={level.bigBlind}
                      onChange={(e) =>
                        updateLevel(index, { bigBlind: Number(e.target.value) })
                      }
                    />
                  </td>
                  <td className="px-1.5 py-2 sm:px-3">
                    <input
                      type="number"
                      className="w-12 rounded bg-themed-tertiary px-1 py-1.5 sm:w-16 sm:px-1.5"
                      value={level.ante}
                      onChange={(e) =>
                        updateLevel(index, { ante: Number(e.target.value) })
                      }
                    />
                  </td>
                </>
              ) : (
                <>
                  <td className="px-1.5 py-2 sm:px-3">{formatNumber(level.smallBlind)}</td>
                  <td className="px-1.5 py-2 sm:px-3">{formatNumber(level.bigBlind)}</td>
                  <td className="px-1.5 py-2 sm:px-3">{level.ante ? formatNumber(level.ante) : '-'}</td>
                </>
              )}
              <td className="px-1.5 py-2 sm:px-3">
                {editable && !level.isBreak ? (
                  <input
                    type="number"
                    className="w-12 rounded bg-themed-tertiary px-1 py-1.5 sm:w-16 sm:px-1.5"
                    value={level.durationSeconds / 60}
                    onChange={(e) =>
                      updateLevel(index, {
                        durationSeconds: Number(e.target.value) * 60,
                      })
                    }
                  />
                ) : (
                  Math.round(level.durationSeconds / 60)
                )}
              </td>
              {editable && (
                <td className="px-1.5 py-2 sm:px-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/20 text-lg font-medium text-accent"
                      onClick={() => addLevel(index)}
                      title="Add level after this one"
                      aria-label="Add level after this one"
                    >
                      +
                    </button>
                    {!level.isBreak && (
                      <button
                        type="button"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-sm font-medium text-amber-400"
                        onClick={() => addBreak(index)}
                        title="Add break after this level"
                        aria-label="Add break after this level"
                      >
                        ||
                      </button>
                    )}
                    <button
                      type="button"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-500/20 text-lg font-medium text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={levels.length <= 1}
                      onClick={() => removeLevel(index)}
                      title="Remove this level"
                      aria-label="Remove this level"
                    >
                      ×
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
