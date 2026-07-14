import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useTournamentStore,
  useClockStore,
  useClockSyncControl,
  useTournamentClock,
  useClockSounds,
  useToast,
} from "@composition/container";
import { formatChipRaceLabel, formatLevelLabel } from "@domain/rules/blindFormat";
import { calculatePayouts, hasPayouts } from "@domain/rules/payouts";
import { calculatePrizePoolForTournament } from "@domain/rules/prizePool";
import {
  computeTournamentStats,
} from "@domain/rules/tournamentStats";
import { getEntryPriceLines } from "@domain/rules/entryPricing";
import {
  startTournament,
  stopTournament,
} from "@domain/rules/tournamentLifecycle";
import { DEFAULT_SOUND_SETTINGS } from "@domain/entities";
import {
  formatMoney,
  formatClock,
  formatDurationHMS,
  formatNumber,
  formatAmount,
} from "@domain/rules/format";
import { copyProjectorLink } from "../../shared/projectorLink";
import TournamentSidebar from "../../components/layout/TournamentSidebar";
import PageHeader from "../../components/layout/PageHeader";
import Toast from "../../components/Toast";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
  ProjectorIcon,
  StopIcon,
} from "../../components/icons";
import type { PayoutStructure } from "@domain/entities";
import BlindStat from "./sections/BlindStat";
import PageShell from "./sections/PageShell";

export default function ControlPage() {
  const { id } = useParams<{ id: string }>();
  const tournamentsLoaded = useTournamentStore((state) => state.isLoaded);
  const tournament = useTournamentStore((state) =>
    id ? state.getById(id) : undefined,
  );
  const saveTournament = useTournamentStore((state) => state.save);

  const history = useClockStore((state) => state.history);
  const isMuted = useClockStore((state) => state.isMuted);
  const start = useClockStore((state) => state.start);
  const pause = useClockStore((state) => state.pause);
  const resume = useClockStore((state) => state.resume);
  const jump = useClockStore((state) => state.jump);
  const advanceToActiveLevel = useClockStore((state) => state.advanceToActiveLevel);
  const adjustTime = useClockStore((state) => state.adjustTime);
  const undo = useClockStore((state) => state.undo);
  const toggleMute = useClockStore((state) => state.toggleMute);

  const { stop: stopClock } = useClockSyncControl(id);
  const [showPayouts, setShowPayouts] = useState(false);
  const { toastMessage, showToast } = useToast();

  async function handleCopyProjectorLink() {
    if (!tournament?.joinCode) return;
    showToast(await copyProjectorLink(tournament.joinCode));
  }

  const payoutStructure: PayoutStructure | undefined = useMemo(
    () =>
      tournament
        ? { name: tournament.name, tiers: tournament.payoutTiers }
        : undefined,
    [tournament],
  );
  const sounds = tournament?.sounds ?? DEFAULT_SOUND_SETTINGS;
  const currency = tournament?.currency ?? "USD";

  const {
    structure,
    clock,
    currentLevel,
    nextLevel,
    secondsRemaining,
    nextBreakSeconds,
    activeLevelIndex,
    now,
  } = useTournamentClock(tournament);

  useClockSounds({
    structure,
    currentLevel,
    activeLevelIndex,
    secondsRemaining,
    sounds,
    muted: isMuted,
  });

  // Persist the time-based rollover: when elapsed time has carried the clock
  // into a later level, write that advance so it syncs to the projector and
  // triggers the level/break sounds. Progress within the new level is preserved
  // (not reset to full), so reopening control never rewinds the countdown.
  useEffect(() => {
    if (!clock || !structure || !id) return;
    if (!clock.isPaused && activeLevelIndex !== clock.currentLevelIndex) {
      advanceToActiveLevel(structure, now);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  if (!tournamentsLoaded) {
    return <PageShell>Loading…</PageShell>;
  }

  if (!tournament || !id) {
    return (
      <PageShell>
        <p>Tournament not found.</p>
        <Link to="/" className="btn-secondary mt-4 inline-block">
          Back to dashboard
        </Link>
      </PageShell>
    );
  }

  if (!structure) {
    return <PageShell>Loading blind structure…</PageShell>;
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
    buyInCount,
    rebuyCount,
    totalEntries,
    totalStack,
    avgStack,
  } = computeTournamentStats(tournament);

  const isBreak = currentLevel?.isBreak ?? false;
  // Breaks are not levels — count and number only play levels.
  const playLevelCount = structure.levels.filter((l) => !l.isBreak).length;
  const isFinalLevel = !isBreak && currentLevel?.level === playLevelCount;
  const isLowTime = secondsRemaining <= 60 && secondsRemaining > 0 && !isBreak;

  async function handleStart() {
    if (!id) return;
    start(id, Date.now());
    await saveTournament(startTournament(tournament!));
  }

  async function handleStop() {
    if (!id) return;
    if (
      !window.confirm(
        "Stop this tournament? The clock will reset — starting again begins from level 1.",
      )
    ) {
      return;
    }
    await stopClock();
    await saveTournament(stopTournament(tournament!));
  }

  return (
    <div className="flex min-h-screen bg-themed-primary text-themed-primary">
      <TournamentSidebar tournamentId={id} />

      <div className="flex flex-1 flex-col pb-16 md:pb-0">
        <PageHeader
          right={
            <div className="flex items-center gap-2">
              {tournament.joinCode && (
                <span className="rounded bg-themed-tertiary px-2 py-1 font-mono text-sm font-semibold tracking-widest text-themed-secondary">
                  {tournament.joinCode}
                </span>
              )}
              <button
                type="button"
                className="btn-ghost p-2"
                title="Copy projector link"
                onClick={handleCopyProjectorLink}
              >
                <ProjectorIcon />
              </button>
            </div>
          }
        />

        <main className="flex flex-1 flex-col items-center overflow-y-auto px-3 py-4 sm:px-6 sm:py-8">
          {!clock ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <p className="text-themed-muted">Ready when you are.</p>
              <button
                type="button"
                className="btn-primary px-6 py-3 text-lg"
                onClick={handleStart}
              >
                Start Tournament
              </button>
            </div>
          ) : currentLevel ? (
            <>
              <div className="grid w-full max-w-3xl grid-cols-3 gap-2 sm:gap-4">
                <Link
                  to={`/tournament/${id}/players`}
                  className="card p-2.5 text-center transition-all hover:ring-2 hover:ring-accent/50 sm:p-4"
                >
                  <div className="mb-1 text-xs text-themed-muted sm:text-sm">
                    Players
                  </div>
                  <div className="text-lg font-bold sm:text-2xl">
                    {formatNumber(remainingPlayers)}{" "}
                    <span className="text-sm font-normal text-themed-muted sm:text-lg">
                      / {formatNumber(totalRegistered)}
                    </span>
                  </div>
                </Link>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPayouts((v) => !v)}
                    className="card w-full p-2.5 text-center transition-all hover:ring-2 hover:ring-accent/50 sm:p-4"
                  >
                    <div className="mb-1 text-xs text-themed-muted sm:text-sm">
                      Prize Pool
                    </div>
                    <div className="text-lg font-bold text-accent sm:text-2xl">
                      {formatMoney(prizePool, currency)}
                    </div>
                  </button>
                  {showPayouts && payoutResults.length > 0 && (
                    <div className="card absolute left-1/2 top-full z-20 mt-1 w-64 -translate-x-1/2 border border-themed p-3 shadow-xl">
                      <div className="mb-2 text-center text-xs uppercase tracking-wide text-themed-muted">
                        Payouts
                      </div>
                      <div className="space-y-1.5">
                        {payoutResults.map((result) => (
                          <div
                            key={result.position}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <span className="shrink-0 text-themed-secondary">
                              #{result.position}
                            </span>
                            <span className="shrink-0 text-xs text-themed-muted">
                              {result.percentage}%
                            </span>
                            <span className="truncate font-semibold">
                              {formatMoney(result.amount, currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="card p-2.5 text-center sm:p-4">
                  <div className="mb-1 text-xs text-themed-muted sm:text-sm">
                    Average Stack
                  </div>
                  <div className="text-lg font-bold sm:text-2xl">
                    {formatNumber(Math.round(avgStack))}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-themed-muted sm:gap-x-4">
                <span>
                  Total Entries{" "}
                  <b className="text-themed-secondary">
                    {formatNumber(totalEntries)}
                  </b>
                </span>
                <span>
                  Re-buy{" "}
                  <b className="text-themed-secondary">
                    {formatNumber(rebuyCount)}
                  </b>
                </span>
                <span>
                  Buy-in{" "}
                  <b className="text-themed-secondary">
                    {formatNumber(buyInCount)}
                  </b>
                </span>
                <span>
                  Total Stack{" "}
                  <b className="text-themed-secondary">
                    {formatNumber(totalStack)}
                  </b>
                </span>
              </div>

              <div className="flex flex-1 flex-col items-center justify-center">
                <h1 className="mb-1 max-w-full truncate text-center text-2xl font-bold text-themed-secondary sm:text-4xl md:text-5xl">
                  {tournament.name}
                </h1>
                <p className="mb-2 text-sm text-themed-muted sm:mb-3 sm:text-base">
                  {entryPriceLines.map((line) => line.label).join("/")} :{" "}
                  {entryPriceLines
                    .map((line) => formatAmount(line.amountCents))
                    .join("/")}
                </p>

                <div
                  className={`mb-3 rounded-full px-4 py-1.5 text-sm font-semibold sm:mb-4 sm:px-6 sm:py-2 sm:text-xl ${
                    isBreak
                      ? "border border-amber-500/30 bg-amber-500/20 text-amber-400"
                      : isFinalLevel
                        ? "border border-accent/30 bg-accent/20 text-accent"
                        : "bg-themed-tertiary text-themed-secondary"
                  }`}
                >
                  {isBreak
                    ? formatLevelLabel(currentLevel)
                    : isFinalLevel
                      ? "Final Level"
                      : `Level ${currentLevel.level} of ${playLevelCount}`}
                </div>

                {isBreak && currentLevel.chipRace && (
                  <div className="mb-3 text-lg font-semibold uppercase tracking-wide sm:mb-4 sm:text-2xl">
                    {formatChipRaceLabel(currentLevel)}
                  </div>
                )}

                <div
                  className={`timer-display text-6xl font-bold leading-none tracking-tighter sm:text-8xl md:text-9xl lg:text-[9rem] ${
                    isLowTime
                      ? "text-red-500"
                      : isBreak
                        ? "text-amber-400"
                        : "text-themed-primary"
                  }`}
                  role="timer"
                  aria-live="assertive"
                  aria-atomic="true"
                  aria-label={`${formatClock(secondsRemaining)} ${clock.isPaused ? "paused" : "running"}`}
                >
                  {formatClock(secondsRemaining)}
                </div>

                {!isBreak && (
                  <div className="mt-6 flex items-center gap-4 sm:mt-8 sm:gap-8 md:gap-10">
                    <BlindStat
                      label="Small Blind"
                      value={formatNumber(currentLevel.smallBlind)}
                    />
                    <span className="text-2xl font-light text-themed-muted sm:text-4xl md:text-5xl">
                      /
                    </span>
                    <BlindStat
                      label="Big Blind"
                      value={formatNumber(currentLevel.bigBlind)}
                    />
                    <span className="text-2xl font-light text-themed-muted sm:text-4xl md:text-5xl">
                      +
                    </span>
                    <BlindStat
                      label="Ante"
                      value={
                        currentLevel.isBigBlindAnte
                          ? `${formatNumber(currentLevel.bigBlind)} BBA`
                          : currentLevel.ante > 0
                            ? formatNumber(currentLevel.ante)
                            : "–"
                      }
                      valueClassName={
                        currentLevel.isBigBlindAnte || currentLevel.ante > 0
                          ? "text-accent"
                          : "text-themed-muted"
                      }
                    />
                  </div>
                )}

                {nextLevel && (
                  <div className="card mt-4 inline-block px-4 py-3 sm:mt-6 sm:px-6 sm:py-4">
                    <div className="mb-2 text-center text-xs uppercase tracking-wide text-themed-muted">
                      Next Level
                    </div>
                    {nextLevel.isBreak ? (
                      <div className="text-center text-lg font-semibold text-amber-400">
                        {formatLevelLabel(nextLevel)}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3 sm:gap-4">
                        <BlindStat
                          label="Small Blind"
                          value={formatNumber(nextLevel.smallBlind)}
                          small
                        />
                        <span className="text-xl font-light text-themed-muted">
                          /
                        </span>
                        <BlindStat
                          label="Big Blind"
                          value={formatNumber(nextLevel.bigBlind)}
                          small
                        />
                        <span className="text-xl font-light text-themed-muted">
                          +
                        </span>
                        <BlindStat
                          label="Ante"
                          value={
                            nextLevel.isBigBlindAnte
                              ? `${formatNumber(nextLevel.bigBlind)} BBA`
                              : nextLevel.ante > 0
                                ? formatNumber(nextLevel.ante)
                                : "–"
                          }
                          valueClassName={
                            nextLevel.isBigBlindAnte || nextLevel.ante > 0
                              ? "text-accent"
                              : "text-themed-muted"
                          }
                          small
                        />
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-themed-muted sm:gap-x-4">
                  <span>
                    Next Break{" "}
                    <b className="text-themed-secondary">
                      {nextBreakSeconds != null
                        ? formatDurationHMS(nextBreakSeconds)
                        : "—"}
                    </b>
                  </span>
                </div>
                <div className="mt-6 flex items-center gap-3 sm:mt-10 sm:gap-4">
                  <button
                    type="button"
                    className="btn-secondary h-10 w-10 rounded-full p-0 sm:h-12 sm:w-12"
                    disabled={clock.currentLevelIndex === 0}
                    onClick={() =>
                      jump(clock.currentLevelIndex - 1, Date.now())
                    }
                    title="Previous level"
                    aria-label="Previous level"
                  >
                    <ChevronLeftIcon />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      clock.isPaused ? resume(Date.now()) : pause(Date.now())
                    }
                    aria-label={clock.isPaused ? "Play" : "Pause"}
                    className={`flex h-16 w-16 items-center justify-center rounded-full transition-all duration-200 sm:h-20 sm:w-20 ${
                      clock.isPaused
                        ? "bg-accent text-white hover:opacity-90"
                        : "bg-themed-tertiary text-themed-primary hover:opacity-80"
                    }`}
                  >
                    {clock.isPaused ? <PlayIcon /> : <PauseIcon />}
                  </button>

                  <button
                    type="button"
                    className="btn-secondary h-10 w-10 rounded-full p-0 sm:h-12 sm:w-12"
                    disabled={
                      clock.currentLevelIndex >= structure.levels.length - 1
                    }
                    onClick={() =>
                      jump(clock.currentLevelIndex + 1, Date.now())
                    }
                    title="Next level"
                    aria-label="Next level"
                  >
                    <ChevronRightIcon />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:mt-6 sm:gap-2">
                  <button
                    type="button"
                    className="btn-ghost text-sm"
                    onClick={() => adjustTime(-60)}
                  >
                    -1m
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-sm"
                    onClick={() => adjustTime(60)}
                  >
                    +1m
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-sm"
                    onClick={() => adjustTime(300)}
                  >
                    +5m
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-sm"
                    disabled={history.length === 0}
                    onClick={undo}
                  >
                    Undo
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-sm"
                    onClick={toggleMute}
                  >
                    {isMuted ? "Unmute" : "Mute"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleStop}
                  className="mb-2 mt-8 inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 sm:mt-10 sm:px-8 sm:py-3.5 sm:text-base"
                >
                  <StopIcon className="h-4 w-4 text-white" />
                  Stop Tournament
                </button>
              </div>
            </>
          ) : null}
        </main>
      </div>

      <Toast message={toastMessage} />
    </div>
  );
}
