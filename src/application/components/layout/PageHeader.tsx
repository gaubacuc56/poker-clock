import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon } from '../icons';

interface PageHeaderProps {
  /** Optional content for the right side (e.g. Control's projector-link button). */
  right?: ReactNode;
  /** Where the Home icon links back to. Defaults to the dashboard. */
  backTo?: string;
}

/** Shared top bar for every tournament-scoped screen (Timer/Players/Setup) — just Home, plus an optional right-side action. */
export default function PageHeader({ right, backTo = '/' }: PageHeaderProps) {
  return (
    <header className="flex min-h-16 shrink-0 items-center justify-between border-b border-themed bg-themed-secondary/30 px-4 py-2 backdrop-blur-sm sm:px-6">
      <Link to={backTo} className="btn-ghost p-2" title="Back" aria-label="Back">
        <HomeIcon />
      </Link>
      {right}
    </header>
  );
}
