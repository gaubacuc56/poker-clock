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
    <div className="flex items-center gap-[14px] border-b border-hair px-0.5 py-[18px]">
      <div className="min-w-0 flex-1">
        <div className="engrave display text-[24px]">{label}</div>
      </div>

      <button
        type="button"
        className="chip chip-slate size-[54px] text-[30px]"
        disabled={!canDecrement}
        onClick={() => onChange(value - 1)}
        aria-label={`Decrease ${label}`}
      >
        −
      </button>
      <span className="engrave display min-w-14 text-center text-[35px] tabular-nums">
        {formatNumber(value)}
      </span>
      <button
        type="button"
        className="chip chip-gold size-[54px] text-[30px]"
        disabled={!canIncrement}
        onClick={() => onChange(value + 1)}
        aria-label={`Increase ${label}`}
      >
        +
      </button>
    </div>
  );
}
