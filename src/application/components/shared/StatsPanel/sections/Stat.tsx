import { pu } from '@application/shared/projectorScale';
import { STAT_LABEL_SIZE, STAT_VALUE_SIZE } from '../constants';

interface StatProps {
  label: string;
  value: string | number;
}

/** One figure under its name, right-aligned against the clock column. */
export default function Stat({ label, value }: StatProps) {
  return (
    <div className="text-right">
      <p
        className="whitespace-nowrap font-semibold uppercase tracking-[0.18em]"
        style={{ fontSize: pu(STAT_LABEL_SIZE) }}
      >
        {label}
      </p>
      <p
        className="display whitespace-nowrap font-bold tabular-nums text-fg"
        style={{ fontSize: pu(STAT_VALUE_SIZE) }}
      >
        {value}
      </p>
    </div>
  );
}
