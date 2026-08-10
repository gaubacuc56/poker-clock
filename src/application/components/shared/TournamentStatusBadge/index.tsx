import type { TournamentStatus } from '@domain/entities';

/* The dot and the label share one colour, carried down as `currentColor`. */
const STATUS_CONFIG: Record<TournamentStatus, { label: string; className: string }> = {
  setup: { label: 'Setup', className: 'text-status-setup' },
  registering: { label: 'Registering', className: 'text-status-registering' },
  running: { label: 'Running', className: 'text-status-running' },
  paused: { label: 'Paused', className: 'text-status-paused' },
  finished: { label: 'Finished', className: 'text-status-finished' },
};

/**
 * A lit dot plus the status in the status colour — the marker at the top of a
 * tournament ticket. Running gets an extra halo so a live tournament is the
 * thing your eye lands on first in the list.
 */
export default function TournamentStatusBadge({ status }: { status: TournamentStatus }) {
  const { label, className } = STATUS_CONFIG[status] ?? STATUS_CONFIG.setup;
  return (
    <span className={`flex items-center gap-[7px] ${className}`}>
      <span
        className={`size-2 shrink-0 rounded-full bg-current ${
          status === 'running'
            ? 'ring-3 ring-current/20'
            : 'ring-1 ring-base/25'
        }`}
      />
      <span className="text-[12.5px] tracking-[.2em] uppercase">{label}</span>
    </span>
  );
}
