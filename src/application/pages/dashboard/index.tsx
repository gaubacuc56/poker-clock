import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTournamentStore, useToast } from '@composition/container';
import type { TournamentConfig } from '@domain/entities';
import { formatNumber } from '@domain/rules/format';
import { copyProjectorLink } from '../../shared/projectorLink';
import Screen from '../../components/layout/Screen';
import TopBar from '../../components/layout/TopBar';
import Brand from '../../components/layout/Brand';
import Toast from '../../components/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';
import TournamentStatusBadge from '../../components/TournamentStatusBadge';
import {
  ChevronRightIcon,
  ClockIcon,
  LinkIcon,
  PlusIcon,
  SettingsIcon,
  TrashIcon,
} from '../../components/icons';

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
    <Screen>
      <TopBar tone="rail">
        <Brand className="size-[34px]" />
        <h1 className="engrave display text-[18px]">Tournaments</h1>
        <Link to="/setup/new" className="btn btn-primary ml-auto text-[15px]">
          <PlusIcon className="size-[17px]" />
          New Tournament
        </Link>
      </TopBar>

      <div className="scroll felt px-4 pt-4 pb-[22px]">
        <div className="content flex flex-col gap-3">
          {tournaments.length === 0 ? (
            <p className="px-2 py-10 text-center text-[16px] text-faint">
              No tournaments yet. Create one to get started.
            </p>
          ) : (
            tournaments.map((tournament) => (
              <div key={tournament.id} className="tkt">
                <div className="tkt-main">
                  <div className="min-w-0 flex-1">
                    <TournamentStatusBadge status={tournament.status} />
                    <Link
                      to={`/tournament/${tournament.id}/control`}
                      className="tkt-name engrave display mt-[3px] w-fit text-[26px] leading-[1.2]"
                    >
                      {tournament.name}
                    </Link>
                    <span className="mt-0.5 block text-[15.5px] text-muted">
                      {formatNumber(tournament.entrantCount)} entrants
                    </span>
                  </div>
                  {tournament.joinCode && (
                    <span className="display flex-none text-right text-[26px] leading-[1.2] font-bold tracking-[.2em] text-accent">
                      {tournament.joinCode}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="tkt-del"
                  title={`Delete ${tournament.name}`}
                  aria-label={`Delete ${tournament.name}`}
                  onClick={() => setPendingDelete(tournament)}
                >
                  <TrashIcon className="size-[14px]" />
                </button>

                <div className="tkt-stub">
                  <span className="tkt-perf" />
                  <Link to={`/tournament/${tournament.id}/control`} className="tkt-act tkt-act-go">
                    <ClockIcon className="size-[17px]" />
                    Open control
                  </Link>
                  <span className="tkt-div" />
                  <button
                    type="button"
                    className="tkt-act"
                    disabled={!tournament.joinCode}
                    onClick={() => handleCopyProjectorLink(tournament.joinCode)}
                  >
                    <LinkIcon className="size-[17px]" />
                    Copy projector link
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Link
        to="/settings"
        className="btn bar-bottom w-full flex-none rounded-none bg-chrome px-4 py-3.5 text-[20px]"
      >
        <span className="content flex items-center justify-between">
          <span className="inline-flex items-center gap-[7px]">
            <SettingsIcon className="size-[17px]" />
            Settings
          </span>
          <ChevronRightIcon className="size-[15px] text-faint" />
        </span>
      </Link>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete tournament?"
        message={`“${pendingDelete?.name ?? ''}” and its blind structure will be removed. This cannot be undone.`}
        isBusy={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <Toast message={toastMessage} />
    </Screen>
  );
}
