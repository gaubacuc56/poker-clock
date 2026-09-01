import { formatPlanAllowance, planUsageFraction } from '@domain/rules/planLimits';

interface AllowanceRowProps {
  label: string;
  /** Null = uncapped, which is drawn as an empty rail rather than a full one. */
  limit: number | null;
  used: number;
}

/** One allowance, read as "used of allowed" with a rail showing how full it is. */
export default function AllowanceRow({ label, limit, used }: AllowanceRowProps) {
  const fraction = planUsageFraction(limit, used);
  const isFull = limit != null && used >= limit;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[18px]">{label}</span>
        <span
          className={`engrave display text-[19px] tabular-nums ${isFull ? 'text-coral' : ''}`}
        >
          {formatPlanAllowance(limit, used)}
        </span>
      </div>
      <div className="h-[6px] overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${
            isFull ? 'bg-coral' : 'bg-accent'
          }`}
          style={{ width: `${Math.round(fraction * 100)}%` }}
        />
      </div>
    </div>
  );
}
