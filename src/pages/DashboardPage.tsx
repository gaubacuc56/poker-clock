import { Link } from 'react-router-dom';
import { useTournamentStore, useAuthStore, useToast } from '@composition/container';
import { formatNumber } from '@domain/rules/format';
import Toast from '../components/Toast';
import { ClockIcon, PlusIcon, ProjectorIcon } from '../components/icons';

export default function DashboardPage() {
  const tournaments = useTournamentStore((state) => state.tournaments);
  const userEmail = useAuthStore((state) => state.session?.email ?? undefined);
  const signOut = useAuthStore((state) => state.signOut);
  const { toastMessage, showToast } = useToast();

  async function handleCopyProjectorLink(joinCode: string | undefined) {
    if (!joinCode) return;
    const url = `${window.location.origin}/p/${joinCode}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast(`Projector link copied — code ${joinCode}`);
    } catch {
      showToast(`Could not copy link — code ${joinCode}`);
    }
  }

  return (
    <div className="min-h-screen bg-themed-primary text-themed-primary">
      <div className="mx-auto max-w-3xl px-4 py-6 pb-20 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Poker Clock</h1>
          <Link to="/setup/new" className="btn-primary inline-flex items-center gap-1.5">
            <PlusIcon className="h-4 w-4" />
            New Tournament
          </Link>
        </div>

        {tournaments.length === 0 ? (
          <p className="text-themed-muted">
            No tournaments yet. Create one to get started.
          </p>
        ) : (
          <ul className="space-y-3">
            {tournaments.map((tournament) => (
              <li
                key={tournament.id}
                className="flex flex-col gap-3 rounded-lg border border-themed bg-themed-secondary/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{tournament.name}</p>
                  <p className="text-sm text-themed-muted">
                    {formatNumber(tournament.entrantCount)} entrants · {tournament.status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/tournament/${tournament.id}/control`}
                    className="btn-primary inline-flex items-center gap-1.5 text-sm"
                  >
                    <ClockIcon className="h-4 w-4" />
                    Control
                  </Link>
                  <button
                    type="button"
                    className="btn-secondary inline-flex items-center gap-1.5 text-sm"
                    onClick={() => handleCopyProjectorLink(tournament.joinCode)}
                  >
                    <ProjectorIcon className="h-4 w-4" />
                    Projector
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center border-t border-themed bg-themed-secondary/95 py-3 backdrop-blur-sm">
        <button
          type="button"
          className="btn-ghost text-sm"
          onClick={signOut}
          title={userEmail}
        >
          Sign out
        </button>
      </div>

      <Toast message={toastMessage} />
    </div>
  );
}
