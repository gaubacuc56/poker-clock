import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  findTournamentByJoinCode,
  useClockSyncProjector,
  useTournamentClock,
  resolveBackgroundPath,
} from "@composition/container";
import { calculatePayouts } from "@domain/rules/payouts";
import { calculatePrizePoolForTournament } from "@domain/rules/prizePool";
import { computeTournamentStats } from "@domain/rules/tournamentStats";
import { getEntryPriceLines } from "@domain/rules/entryPricing";
import { formatMoney, formatAmount, formatNumber } from "@domain/rules/format";
import ClockDisplay from "../../components/clock/ClockDisplay";
import StatsPanel from "../../components/clock/StatsPanel";
import PayoutTable from "../../components/payouts/PayoutTable";
import ClubLogo from "../../components/projector/ClubLogo";
import type { PayoutStructure, TournamentConfig } from "@domain/entities";
import Centered from "./sections/Centered";

/** Live countdown state comes from Supabase Realtime; this just keeps slower-changing fields (player counts, prize pool) fresh. */
const REFRESH_INTERVAL_MS = 8000;

export default function ProjectorPage() {
  const { code } = useParams<{ code: string }>();
  const [tournament, setTournament] = useState<
    TournamentConfig | null | undefined
  >(undefined);

  useEffect(() => {
    if (!code) return;
    const joinCode = code;
    let cancelled = false;

    function refresh() {
      findTournamentByJoinCode(joinCode)
        .then((result) => {
          if (!cancelled) setTournament(result);
        })
        .catch(() => {
          if (!cancelled) setTournament(null);
        });
    }

    refresh();
    const interval = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [code]);

  useClockSyncProjector(tournament?.id);

  const payoutStructure: PayoutStructure | undefined = tournament
    ? { name: tournament.name, tiers: tournament.payoutTiers }
    : undefined;

  const { clock, currentLevel, nextLevel, secondsRemaining, nextBreakSeconds } =
    useTournamentClock(tournament);

  if (tournament === undefined) {
    return <Centered>Loading…</Centered>;
  }

  if (tournament === null) {
    return <Centered>No tournament found for this code.</Centered>;
  }

  if (!clock || !currentLevel) {
    return <Centered>{tournament.name} — waiting for clock to start</Centered>;
  }

  const prizePool = calculatePrizePoolForTournament(tournament);
  const payoutResults = payoutStructure
    ? calculatePayouts(payoutStructure, prizePool, tournament.payoutUnit)
    : [];
  const entryPriceLines = getEntryPriceLines(tournament);
  const {
    totalRegistered,
    remainingPlayers,
    buyInCount,
    rebuyCount,
    totalEntries,
    totalStack,
    avgStack,
    startingStack
  } = computeTournamentStats(tournament);
  const backgroundPath = resolveBackgroundPath(tournament.projectorBackgroundId);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 text-white">
      {backgroundPath && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundPath})` }}
        />
      )}

      <div
        className="relative z-10 flex h-full flex-col"
        style={{ padding: "clamp(1rem, 2.5vw, 2.75rem)" }}
      >
        <div
          className="grid shrink-0 items-start gap-4"
          style={{ gridTemplateColumns: "1fr auto 1fr" }}
        >
          <div className="flex justify-start">
            <ClubLogo />
          </div>
          <div className="flex max-w-full flex-col items-center justify-self-center px-4">
            <h1
              className="max-w-full truncate text-center font-bold"
              style={{ fontSize: "clamp(1.25rem, 2.6vw, 3.25rem)" }}
            >
              {tournament.name}
            </h1>
            <div className="flex gap-[3rem]">
              {entryPriceLines.map((line) => (
                <p
                  key={line.label}
                  className="max-w-full truncate text-center"
                  style={{ fontSize: "clamp(0.7rem, 1.5vw, 1.5rem)" }}
                >
                  {line.label}: {formatAmount(line.amountCents)}{" "}
                </p>
              ))}
               <p
                  className="max-w-full truncate text-center"
                  style={{ fontSize: "clamp(0.7rem, 1.5vw, 1.5rem)" }}
                >
                  Stack: {formatNumber(startingStack)}
                </p>
              {/* {entryPriceLines.map((line) => line.label).join('/')} :{' '}
            {entryPriceLines.map((line) => formatAmount(line.amountCents)).join('/')} */}
            </div>
          
          </div>
          <div className="justify-self-end text-center">
            <p
              className="uppercase tracking-wide"
              style={{ fontSize: "clamp(0.7rem, 1vw, 1.15rem)" }}
            >
              Prize Pool
            </p>
            <p
              className="font-bold tabular-nums"
              style={{ fontSize: "clamp(1.5rem, 3vw, 3.5rem)" }}
            >
              {formatMoney(prizePool, tournament.currency ?? "USD")}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-1 items-stretch gap-6 overflow-hidden">
          <div
            style={{ width: "clamp(9rem, 15vw, 17rem)" }}
            className="shrink-0"
          >
            <StatsPanel
              remainingPlayers={remainingPlayers}
              totalRegistered={totalRegistered}
              totalEntries={totalEntries}
              buyInCount={buyInCount}
              rebuyCount={rebuyCount}
              totalStack={totalStack}
              avgStack={avgStack}
              nextBreakSeconds={nextBreakSeconds}
            />
          </div>

          <div className="flex flex-1 items-center justify-center overflow-hidden">
            <ClockDisplay
              level={currentLevel}
              nextLevel={nextLevel}
              secondsRemaining={secondsRemaining}
              isPaused={clock.isPaused}
            />
          </div>

          {payoutResults.length > 0 && (
            <div
              style={{ width: "clamp(10rem, 16vw, 19rem)" }}
              className="shrink-0"
            >
              <PayoutTable
                results={payoutResults}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
