import { pu } from '@application/shared/projectorScale';
import { BLIND_VALUE_SIZE, STAT_LABEL_SIZE } from '../../LedgerLayout/constants';

interface BlindProps {
  label: string;
  value: string;
}

/** One blind under its name, the same pairing ledger sets below its clock. */
export default function Blind({ label, value }: BlindProps) {
  return (
    <div className="text-center">
      <div
        className="uppercase"
        style={{
          fontSize: pu(STAT_LABEL_SIZE),
          lineHeight: 1.2,
          letterSpacing: '.2em',
          color: 'var(--pj-faint)',
        }}
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
