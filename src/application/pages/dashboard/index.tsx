import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTournamentStore, useToast } from '@composition/container';
import type { TournamentConfig } from '@domain/entities';
import { formatNumber } from '@domain/rules/format';
import { copyProjectorLink } from '../../shared/projectorLink';
import Toast from '../../components/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';
import TournamentStatusBadge from '../../components/TournamentStatusBadge';
import { ClockIcon, PlusIcon, ProjectorIcon, SettingsIcon, TrashIcon } from '../../components/icons';

export default function DashboardPage() {
  const tournaments = useTournamentStore((state) => state.tournaments);
  const remove = useTournamentStore((state) => state.remove);
  const { toastMessage, showToast } = useToast();

  const [pendingDelete, setPendingDelete] = useState<TournamentConfig | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleCopyProjectorLink(joinCode: string | undefined) {
    if (!joinCode) return;
    showToast(await copyProjectorLink(joinCode));
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await remove(pendingDelete.id);
      showToast(`Deleted "${pendingDelete.name}"`);
      setPendingDelete(null);
    } catch {
      showToast('Could not delete tournament.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-themed-primary text-themed-primary">
      <header className="shrink-0 border-b border-themed bg-themed-secondary/30 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <h1 className="text-2xl font-semibold">Poker Clock</h1>
          <Link to="/setup/new" className="btn-primary inline-flex items-center gap-1.5">
            <PlusIcon className="h-4 w-4" />
            New Tournament
          </Link>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          {tournaments.length === 0 ? (
            <p className="text-themed-muted">No tournaments yet. Create one to get started.</p>
          ) : (
            <ul className="space-y-3">
              {tournaments.map((tournament) => (
                <li
                  key={tournament.id}
                  className="flex flex-col gap-3 rounded-lg border border-themed bg-themed-secondary/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-3 justify-between">
                      <p className="font-medium">{tournament.name}</p>
                      {tournament.joinCode && (
                        <div className="flex items-center rounded bg-themed-tertiary px-2 py-0.5 font-mono font-semibold text-themed-secondary">
                          {tournament.joinCode}
                        </div>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-base text-themed-muted">
                      <span>{formatNumber(tournament.entrantCount)} entrants</span>
                      <TournamentStatusBadge status={tournament.status} />
                    </div>
                  </div>
                  <div className="flex justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/tournament/${tournament.id}/control`}
                        className="btn-primary inline-flex items-center gap-1.5 text-sm"
                      >
                        <ClockIcon className="h-5 w-5" />
                        Control
                      </Link>
                      <button
                        type="button"
                        className="btn-secondary inline-flex items-center gap-1.5 text-sm"
                        onClick={() => handleCopyProjectorLink(tournament.joinCode)}
                      >
                        <ProjectorIcon className="h-5 w-5" />
                        Projector
                      </button>
                    </div>
                    <button
                      type="button"
                      className="btn-danger p-2 text-sm"
                      title={`Delete ${tournament.name}`}
                      aria-label={`Delete ${tournament.name}`}
                      onClick={() => setPendingDelete(tournament)}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <div className="shrink-0 border-t border-themed bg-themed-secondary/80 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/settings"
            className="btn-secondary inline-flex w-full items-center justify-center gap-2"
          >
            <SettingsIcon className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete tournament?"
        message={`"${pendingDelete?.name ?? ''}" and its clock will be permanently deleted. This can't be undone.`}
        isBusy={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <Toast message={toastMessage} />
    </div>
  );
}
