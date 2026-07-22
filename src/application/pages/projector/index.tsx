import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  findTournamentByJoinCode,
  useClockSyncProjector,
  useClockSounds,
  useTournamentClock,
  resolveBackgroundPath,
  primeSounds,
} from "@composition/container";
import { DEFAULT_SOUND_SETTINGS } from "@domain/entities";
import { calculatePayouts, hasPayouts } from "@domain/rules/payouts";
import { calculatePrizePoolForTournament } from "@domain/rules/prizePool";
import { computeTournamentStats } from "@domain/rules/tournamentStats";
import { getEntryPriceLines } from "@domain/rules/entryPricing";
import { isTournamentFinished } from "@domain/rules/tournamentLifecycle";
import ProjectorView from "../../components/projector/ProjectorView";
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

  const {
    structure,
    clock,
    currentLevel,
    nextLevel,
    secondsRemaining,
    nextBreakSeconds,
    activeLevelIndex,
  } = useTournamentClock(tournament);

  const sounds = tournament?.sounds ?? DEFAULT_SOUND_SETTINGS;

  // The projector makes sound too, so a TV showing only this screen still plays
  // level/break transitions and time warnings.
  useClockSounds({
    structure,
    currentLevel,
    activeLevelIndex,
    secondsRemaining,
    sounds,
  });

  // Browsers block audio until the page receives a user gesture. If the
  // projector was opened directly (history/bookmark) with no gesture yet, show
  // a one-tap prompt; if it was reached by clicking through the entry page,
  // `hasBeenActive` is already true and this never appears.
  const [needsSoundUnlock, setNeedsSoundUnlock] = useState(
    () => !navigator.userActivation?.hasBeenActive,
  );

  function enableSound() {
    primeSounds(Object.values(sounds));
    setNeedsSoundUnlock(false);
  }

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
  const payoutResults =
    payoutStructure && hasPayouts(tournament.payoutTiers)
      ? calculatePayouts(payoutStructure, prizePool, tournament.payoutUnit)
      : [];
  const entryPriceLines = getEntryPriceLines(tournament);
  const {
    totalRegistered,
    remainingPlayers,
    rebuyCount,
    totalEntries,
    totalStack,
    avgStack,
    startingStack
  } = computeTournamentStats(tournament);
  const backgroundPath = resolveBackgroundPath(tournament.projectorBackgroundId);

  const isFinished = structure
    ? isTournamentFinished(
        tournament.status,
        structure,
        currentLevel,
        secondsRemaining,
      )
    : false;

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <ProjectorView
        tournamentName={tournament.name}
        currency={tournament.currency ?? "USD"}
        backgroundPath={backgroundPath}
        entryPriceLines={entryPriceLines}
        startingStack={startingStack}
        prizePool={prizePool}
        payoutResults={payoutResults}
        currentLevel={currentLevel}
        nextLevel={nextLevel}
        secondsRemaining={secondsRemaining}
        isPaused={clock.isPaused}
        isFinished={isFinished}
        remainingPlayers={remainingPlayers}
        totalRegistered={totalRegistered}
        totalEntries={totalEntries}
        rebuyCount={rebuyCount}
        totalStack={totalStack}
        avgStack={avgStack}
        nextBreakSeconds={nextBreakSeconds}
      />

      {needsSoundUnlock && (
        <button
          type="button"
          onClick={enableSound}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-950/80 text-white backdrop-blur-sm"
          aria-label="Tap to enable sound"
        >
          <span style={{ fontSize: "clamp(3rem, 8vw, 6rem)" }}>🔊</span>
          <span
            className="font-semibold"
            style={{ fontSize: "clamp(1.25rem, 3vw, 2.5rem)" }}
          >
            Tap to enable sound
          </span>
        </button>
      )}
    </div>
  );
}
