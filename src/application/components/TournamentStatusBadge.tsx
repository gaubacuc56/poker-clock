import type { TournamentStatus } from '@domain/entities';

const STATUS_CONFIG: Record<TournamentStatus, { label: string; className: string }> = {
  setup: { label: 'Setup', className: 'bg-themed-tertiary text-themed-secondary' },
  registering: { label: 'Registering', className: 'bg-blue-500/15 text-blue-400' },
  running: { label: 'Running', className: 'bg-green-500/15 text-green-400' },
  paused: { label: 'Paused', className: 'bg-amber-500/15 text-amber-400' },
  finished: { label: 'Finished', className: 'bg-accent/15 text-accent' },
};

/** Small colored pill summarizing a tournament's lifecycle status. */
export default function TournamentStatusBadge({ status }: { status: TournamentStatus }) {
  const { label, className } = STATUS_CONFIG[status] ?? STATUS_CONFIG.setup;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold ${className}`}
    >
      {label}
    </span>
  );
}
