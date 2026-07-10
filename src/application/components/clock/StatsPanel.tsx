import { formatDurationHMS, formatNumber } from '@domain/rules/format';

interface StatsPanelProps {
  remainingPlayers: number;
  totalRegistered: number;
  totalEntries: number;
  buyInCount: number;
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
  buyInCount,
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
      <Stat label="Total Entries" value={formatNumber(totalEntries)} />
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Re-buy" value={formatNumber(rebuyCount)} />
        <Stat label="Buy-in" value={formatNumber(buyInCount)} />
      </div>
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
    <div className="text-center">
      <p
        className="uppercase tracking-wide text-white"
        style={{ fontSize: 'clamp(0.65rem, 0.9vw, 1.25rem)' }}
      >
        {label}
      </p>
      <p
        className="mt-1 font-bold tabular-nums"
        style={{ fontSize: 'clamp(1.1rem, 2.1vw, 3rem)' }}
      >
        {value}
      </p>
    </div>
  );
}
