import { useParams } from 'react-router-dom';
import { useTournamentStore } from '@composition/container';
import { calculatePrizePoolForTournament } from '@domain/rules/prizePool';
import { computeTournamentStats } from '@domain/rules/tournamentStats';
import { formatMoney, formatNumber } from '@domain/rules/format';
import type { TournamentConfig } from '@domain/entities';
import Screen from '../../components/layout/Screen';
import TopBar, { BackLink, BarTitle } from '../../components/layout/TopBar';
import TournamentDock from '../../components/layout/TournamentDock';
import CounterRow from './sections/CounterRow';

export default function PlayersPage() {
  const { id } = useParams<{ id: string }>();
  const tournament = useTournamentStore((state) => (id ? state.getById(id) : undefined));
  const saveTournament = useTournamentStore((state) => state.save);

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
  const fieldRemaining = tournament.entrantCount
    ? Math.round((remainingPlayers / tournament.entrantCount) * 100)
    : 0;

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
          <div className="px-0.5 pt-[18px] pb-5">
            <div className="flex items-baseline gap-2.5">
              <span className="engrave display text-[47px] leading-none font-bold">
                {formatNumber(remainingPlayers)}
              </span>
              <span className="text-[16px] text-muted">
                still in, of {formatNumber(tournament.entrantCount)}
              </span>
            </div>

            <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-hair">
              <div
                className="rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${fieldRemaining}%` }}
              />
            </div>

            <div className="kicker mt-1.5 flex justify-between tracking-[.14em]">
              <span>In play</span>
              <span>{formatNumber(tournament.eliminatedCount)} eliminated</span>
            </div>
          </div>

          <CounterRow
            label="Buy-ins"
            hint="Cannot go below eliminated"
            value={tournament.entrantCount}
            min={tournament.eliminatedCount}
            onChange={(value) => update({ entrantCount: value })}
          />
          <CounterRow
            label="Eliminated"
            hint="0 … buy-ins"
            value={tournament.eliminatedCount}
            min={0}
            max={tournament.entrantCount}
            onChange={(value) => update({ eliminatedCount: value })}
          />
          {tournament.allowRebuy && (
            <CounterRow
              label="Rebuys"
              hint="Grants the starting stack"
              value={tournament.rebuyCount}
              min={0}
              onChange={(value) => update({ rebuyCount: value })}
            />
          )}
          {tournament.allowAddOn && (
            <CounterRow
              label="Add-ons"
              hint="Grants the starting stack"
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
