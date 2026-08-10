import { Link, useLocation } from 'react-router-dom';
import { ClockIcon, PlayersIcon, SlidersIcon } from '@application/components/ui/icons';

interface TournamentDockProps {
  tournamentId: string;
}

const TABS = [
  { key: 'control', label: 'Timer', Icon: ClockIcon, path: (id: string) => `/tournament/${id}/control` },
  { key: 'players', label: 'Players', Icon: PlayersIcon, path: (id: string) => `/tournament/${id}/players` },
  { key: 'setup', label: 'Setup', Icon: SlidersIcon, path: (id: string) => `/setup/${id}` },
] as const;

/**
 * Navigation for the three tournament-scoped screens — a bottom bar in the
 * screen's flow at every size, rather than a sidebar on desktop and a tab bar
 * on mobile.
 */
export default function TournamentDock({ tournamentId }: TournamentDockProps) {
  const location = useLocation();

  return (
    <nav className="dock" aria-label="Tournament">
      {/* The bar spans the window; its tabs stay on the shared content column. */}
      <div className="content dock-row">
        {TABS.map(({ key, label, Icon, path }) => {
          const href = path(tournamentId);
          const isActive = location.pathname === href;
          return (
            <Link key={key} to={href} className="btn" aria-current={isActive ? 'page' : undefined}>
              <Icon className="size-[19px]" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
