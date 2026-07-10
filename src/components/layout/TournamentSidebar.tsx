import { Link, useLocation } from 'react-router-dom';
import { ClockIcon, PlayersIcon, SettingsIcon } from '../icons';

interface TournamentSidebarProps {
  tournamentId: string;
}

const TABS = [
  { key: 'control', label: 'Timer', Icon: ClockIcon, path: (id: string) => `/tournament/${id}/control` },
  { key: 'players', label: 'Players', Icon: PlayersIcon, path: (id: string) => `/tournament/${id}/players` },
  { key: 'setup', label: 'Setup', Icon: SettingsIcon, path: (id: string) => `/setup/${id}` },
] as const;

export default function TournamentSidebar({ tournamentId }: TournamentSidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Desktop: vertical sidebar */}
      <nav className="hidden w-20 shrink-0 flex-col items-center gap-2 border-r border-themed bg-themed-secondary/30 py-4 md:flex">
        {TABS.map(({ key, label, Icon, path }) => {
          const href = path(tournamentId);
          const isActive = location.pathname === href;
          return (
            <Link
              key={key}
              to={href}
              className={`flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-xl transition-colors duration-200 ${
                isActive
                  ? 'bg-accent/20 text-accent'
                  : 'text-themed-muted hover:bg-themed-tertiary/50 hover:text-themed-primary'
              }`}
            >
              <Icon />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile: bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-themed bg-themed-secondary/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden">
        {TABS.map(({ key, label, Icon, path }) => {
          const href = path(tournamentId);
          const isActive = location.pathname === href;
          return (
            <Link
              key={key}
              to={href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors duration-200 ${
                isActive ? 'text-accent' : 'text-themed-muted'
              }`}
            >
              <Icon />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
