import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTournamentStore } from '@composition/container';
import { calculatePrizePoolForTournament } from '@domain/rules/prizePool';
import { computeTournamentStats } from '@domain/rules/tournamentStats';
import { formatMoney, formatNumber } from '@domain/rules/format';
import type { TournamentConfig } from '@domain/entities';
import Screen from '@application/components/template/Screen';
import TopBar from '@application/components/template/TopBar';
import BackLink from '@application/components/template/TopBar/sections/BackLink';
import BarTitle from '@application/components/template/TopBar/sections/BarTitle';
import TournamentDock from '@application/components/template/TournamentDock';
import CounterRow from './sections/CounterRow';

export default function PlayersPage() {
  const { id } = useParams<{ id: string }>();
  const tournament = useTournamentStore((state) => (id ? state.getById(id) : undefined));
  const saveTournament = useTournamentStore((state) => state.save);
  const tournamentsLoaded = useTournamentStore((state) => state.isLoaded);
  const loadTournaments = useTournamentStore((state) => state.load);

  useEffect(() => {
    void loadTournaments();
  }, [loadTournaments]);

  if (!tournamentsLoaded) {
    return (
      <Screen>
        <div className="scroll felt grid place-items-center text-muted">Loading…</div>
      </Screen>
    );
  }

  if (!tournament || !id) {
    return (
      <Screen>
        <div className="scroll felt grid place-items-center text-muted">
          Tournament not found.
        </div>
      </Screen>
    );
  }

  const prizePool = calculatePrizePoolForTournament(tournament);
  const { remainingPlayers } = computeTournamentStats(tournament);
  const currency = tournament.currency ?? 'USD';

  function update(patch: Partial<TournamentConfig>) {
    saveTournament({ ...tournament!, ...patch });
  }

  return (
    <Screen>
      <TopBar tone="rail">
        <BackLink to={`/tournament/${id}/control`} label="Back to timer" />
        <BarTitle
          title={`${tournament.name} — Players`}
          subtitle={`${formatNumber(remainingPlayers)} remaining of ${formatNumber(
            tournament.entrantCount,
          )} · Prize pool: ${formatMoney(prizePool, currency)}`}
        />
      </TopBar>

      <div className="scroll felt px-[18px] pt-1.5 pb-5">
        <div className="content">
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
              label="Re-buys"
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
      </div>

      <TournamentDock tournamentId={id} />
    </Screen>
  );
}
