import { pu } from '@application/shared/projectorScale';
import { LEVEL_LABEL_SIZE } from '../../LedgerLayout/constants';

/**
 * Sits on the figures' baseline rather than the row's, so it divides the
 * numbers and not the labels above them.
 */
export default function Slash() {
  return (
    <span
      style={{ fontSize: pu(LEVEL_LABEL_SIZE), color: 'var(--pj-hair-2)', paddingBottom: pu(0.4) }}
    >
      /
    </span>
  );
}
