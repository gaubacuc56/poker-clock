import type { ProjectorStat } from '@domain/rules/projectorModel';
import Stat from './sections/Stat';

interface StatsPanelProps {
  stats: ProjectorStat[];
}

/**
 * Fills the full height of its column, top to bottom — stats spread out via
 * `justify-between` rather than clustering at the top.
 *
 * The figures arrive already built: which six they are, and how each is worded
 * and formatted, is `buildProjectorModel`'s business, so the classic layout and
 * the other three cannot drift apart on it.
 */
export default function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <div className="flex h-full flex-col justify-between">
      {stats.map((stat) => (
        <Stat key={stat.label} label={stat.label} value={stat.value} />
      ))}
    </div>
  );
}
