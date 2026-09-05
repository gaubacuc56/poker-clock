import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useTournamentStore,
  useClockTick,
  usePlanStore,
  useToast,
} from '@composition/container';
import type { TournamentConfig } from '@domain/entities';
import { formatNumber } from '@domain/rules/format';
import { displayedTournamentStatus } from '@domain/rules/tournamentLifecycle';
import { planLimitMessage } from '@domain/rules/planLimits';
import { copyProjectorLink } from '../../shared/projectorLink';
import Screen from '@application/components/template/Screen';
import TopBar from '@application/components/template/TopBar';
import Brand from '@application/components/template/Brand';
import Toast from '@application/components/ui/Toast';
import ConfirmDialog from '@application/components/ui/ConfirmDialog';
import TournamentStatusBadge from '@application/components/shared/TournamentStatusBadge';
import PlanEndingNotice from '@application/components/shared/PlanEndingNotice';
import {
  ChevronRightIcon,
  ClockIcon,
  LinkIcon,
  PlusIcon,
  SettingsIcon,
  TrashIcon,
} from '@application/components/ui/icons';

export default function DashboardPage() {
  const tournaments = useTournamentStore((state) => state.tournaments);
  const remove = useTournamentStore((state) => state.remove);
  const tournamentsLoaded = useTournamentStore((state) => state.isLoaded);
  const loadTournaments = useTournamentStore((state) => state.load);
  const plan = usePlanStore((state) => state.plan);
  const loadPlan = usePlanStore((state) => state.load);
  const { toastMessage, showToast } = useToast();
  const now = useClockTick(30_000);

  useEffect(() => {
    void loadTournaments();
    void loadPlan();
  }, [loadTournaments, loadPlan]);

  const tournamentLimitMessage = planLimitMessage(plan, 'tournaments', tournaments.length);

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
        <h1 className="engrave display text-[18px] hidden sm:block">Tournaments</h1>
        {tournamentLimitMessage ? (
          <button
            type="button"
            className="btn btn-primary ml-auto text-[15px]"
            disabled
            title={tournamentLimitMessage}
          >
            <PlusIcon className="size-[17px]" />
            New Tournament
          </button>
        ) : (
          <Link to="/setup/new" className="btn btn-primary ml-auto text-[15px]">
            <PlusIcon className="size-[17px]" />
            New Tournament
          </Link>
        )}
      </TopBar>

      <div className="scroll felt px-4 pt-4 pb-[22px]">
        <div className="content flex flex-col gap-3">
          <PlanEndingNotice />
          {tournamentLimitMessage && (
            <p className="text-[18px] text-coral">{tournamentLimitMessage}</p>
          )}

          {!tournamentsLoaded ? (
            <p className="px-2 py-10 text-center text-[16px] text-faint">Loading…</p>
          ) : tournaments.length === 0 ? (
            <p className="px-2 py-10 text-center text-[16px] text-faint">
              No tournaments yet. Create one to get started.
            </p>
          ) : (
            tournaments.map((tournament) => (
              <div key={tournament.id} className="tkt">
                <div className="tkt-main">
                  <TournamentStatusBadge status={displayedTournamentStatus(tournament, now)} />
                  <Link
                    to={`/tournament/${tournament.id}/control`}
                    className="tkt-name engrave display mt-[3px] text-[26px] leading-[1.2]"
                  >
                    {tournament.name}
                  </Link>
                  {/* The count and the code share a line: two short readings of
                      the ticket, and the name above them gets the full width. */}
                  <div className="mt-1 flex w-full items-baseline justify-between gap-3">
                    <span className="text-[15.5px] text-muted">
                      {formatNumber(tournament.entrantCount)} entrants
                    </span>
                    {tournament.joinCode && (
                      <span className="display flex-none text-right text-[22px] leading-[1.2] font-bold tracking-[.2em] text-accent">
                        {tournament.joinCode}
                      </span>
                    )}
                  </div>
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
                    Projector link
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
