import { formatNumber } from '@domain/rules/format';

export default function CounterRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  const canDecrement = value > min;
  const canIncrement = max === undefined || value < max;

  return (
    <div className="card flex items-center justify-between gap-4 p-3 sm:p-4">
      <span className="text-sm font-medium sm:text-base">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="btn-secondary h-11 w-11 rounded-full p-0 text-xl"
          disabled={!canDecrement}
          onClick={() => onChange(value - 1)}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="w-10 text-center text-xl font-bold tabular-nums">{formatNumber(value)}</span>
        <button
          type="button"
          className="btn-secondary h-11 w-11 rounded-full p-0 text-xl"
          disabled={!canIncrement}
          onClick={() => onChange(value + 1)}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
