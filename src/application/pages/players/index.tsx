import { useParams } from 'react-router-dom';
import { useTournamentStore } from '@composition/container';
import { calculatePrizePoolForTournament } from '@domain/rules/prizePool';
import { computeTournamentStats } from '@domain/rules/tournamentStats';
import { formatMoney, formatNumber } from '@domain/rules/format';
import TournamentSidebar from '../../components/layout/TournamentSidebar';
import PageHeader from '../../components/layout/PageHeader';
import type { TournamentConfig } from '@domain/entities';
import CounterRow from './sections/CounterRow';

export default function PlayersPage() {
  const { id } = useParams<{ id: string }>();
  const tournament = useTournamentStore((state) =>
    id ? state.getById(id) : undefined,
  );
  const saveTournament = useTournamentStore((state) => state.save);

  if (!tournament || !id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-themed-primary text-themed-primary">
        Tournament not found.
      </div>
    );
  }

  const prizePool = calculatePrizePoolForTournament(tournament);
  const { remainingPlayers } = computeTournamentStats(tournament);

  function update(patch: Partial<TournamentConfig>) {
    saveTournament({ ...tournament!, ...patch });
  }

  return (
    <div className="flex min-h-screen bg-themed-primary text-themed-primary">
      <TournamentSidebar tournamentId={id} />

      <div className="flex flex-1 flex-col pb-16 md:pb-0">
        <PageHeader />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">{tournament.name} — Players</h1>
            <p className="text-sm text-themed-muted">
              {formatNumber(remainingPlayers)} remaining of {formatNumber(tournament.entrantCount)} · Prize pool:{' '}
              {formatMoney(prizePool, tournament.currency ?? 'USD')}
            </p>
          </div>

          <div className="space-y-3">
            <CounterRow
              label="Buy-ins"
              value={tournament.entrantCount}
              min={tournament.eliminatedCount}
              onChange={(value) => update({ entrantCount: value })}
            />
            <CounterRow
              label="Eliminated"
              value={tournament.eliminatedCount}
              min={0}
              max={tournament.entrantCount}
              onChange={(value) => update({ eliminatedCount: value })}
            />
            {tournament.allowRebuy && (
              <CounterRow
                label="Rebuys"
                value={tournament.rebuyCount}
                min={0}
                onChange={(value) => update({ rebuyCount: value })}
              />
            )}
            {tournament.allowAddOn && (
              <CounterRow
                label="Add-ons"
                value={tournament.addOnCount}
                min={0}
                onChange={(value) => update({ addOnCount: value })}
              />
            )}
          </div>

          <p className="mt-6 text-xs text-themed-muted">
            Rebuys and add-ons are each assumed to cost the buy-in and grant the
            starting stack.
          </p>
        </div>
        </main>
      </div>
    </div>
  );
}
