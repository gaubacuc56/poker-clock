import { formatDurationHMS, formatNumber } from '@domain/rules/format';
import { pu } from '../../shared/projectorScale';

interface StatsPanelProps {
  remainingPlayers: number;
  totalRegistered: number;
  totalEntries: number;
  rebuyCount: number;
  totalStack: number;
  avgStack: number;
  nextBreakSeconds: number | null;
}

/** Fills the full height of its column, top to bottom — stats spread out via `justify-between` rather than clustering at the top. */
export default function StatsPanel({
  remainingPlayers,
  totalRegistered,
  totalEntries,
  rebuyCount,
  totalStack,
  avgStack,
  nextBreakSeconds,
}: StatsPanelProps) {
  return (
    <div className="flex h-full flex-col justify-between">
      <Stat
        label="Players"
        value={`${formatNumber(remainingPlayers)} / ${formatNumber(totalRegistered)}`}
      />
      <Stat label="Re-buy" value={formatNumber(rebuyCount)} />
      <Stat label="Total Entries" value={formatNumber(totalEntries)} />
      <Stat label="Total Stack" value={formatNumber(totalStack)} />
      <Stat label="Avg Stack" value={formatNumber(avgStack, { maximumFractionDigits: 0 })} />
      <Stat
        label="Next Break"
        value={nextBreakSeconds != null ? formatDurationHMS(nextBreakSeconds) : '—'}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-right">
      <p
        className="whitespace-nowrap font-semibold uppercase tracking-[0.18em] text-faint"
        style={{ fontSize: pu(1.9) }}
      >
        {label}
      </p>
      <p
        className="display whitespace-nowrap font-bold tabular-nums text-fg"
        style={{ fontSize: pu(2.6) }}
      >
        {value}
      </p>
    </div>
  );
}
