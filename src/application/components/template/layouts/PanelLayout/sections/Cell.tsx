import { pu } from '@application/shared/projectorScale';
import { BLIND_LABEL_SIZE, BLIND_VALUE_SIZE } from '../../LedgerLayout/constants';

interface CellProps {
  label: string;
  value: string;
}

/** One figure under its name on the clock card — panel's pairing of ledger's `Blind`. */
export default function Cell({ label, value }: CellProps) {
  return (
    <div className="text-center">
      <div
        style={{ fontSize: pu(BLIND_LABEL_SIZE), letterSpacing: '.2em', color: 'var(--pj-faint)' }}
      >
        {label}
      </div>
      <div
        className="display tabular-nums"
        style={{
          fontSize: pu(BLIND_VALUE_SIZE),
          fontWeight: 600,
          lineHeight: 1.05,
          color: 'var(--pj-gold)',
        }}
      >
        {value}
      </div>
    </div>
  );
}
