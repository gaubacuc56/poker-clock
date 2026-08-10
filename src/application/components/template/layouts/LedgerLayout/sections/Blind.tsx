import { pu } from '@application/shared/projectorScale';
import { ANTE_UNIT_SIZE, BLIND_LABEL_SIZE, BLIND_VALUE_SIZE } from '../constants';

interface BlindProps {
  label: string;
  value: string;
  /** "BBA" beside a big-blind ante, absent for a plain figure. */
  unit?: string;
}

/** One blind under its name — the trio below the clock. */
export default function Blind({ label, value, unit }: BlindProps) {
  return (
    <div className="text-center">
      <div
        className="uppercase"
        style={{ fontSize: pu(BLIND_LABEL_SIZE), letterSpacing: '.24em', color: 'var(--pj-faint)' }}
      >
        {label}
      </div>
      <div
        className="display whitespace-nowrap tabular-nums"
        style={{
          fontSize: pu(BLIND_VALUE_SIZE),
          fontWeight: 600,
          lineHeight: 1.05,
          color: 'var(--pj-gold)',
        }}
      >
        {value}
        {unit && (
          <span
            style={{ fontSize: pu(ANTE_UNIT_SIZE), letterSpacing: '.08em', marginLeft: pu(0.4) }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
