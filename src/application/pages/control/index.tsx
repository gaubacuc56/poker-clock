import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useTournamentStore,
  useClockStore,
  useClockSyncControl,
  useTournamentClock,
  useClockSounds,
  useToast,
  resolveBackgroundPath,
} from "@composition/container";
import { formatChipRaceLabel, formatLevelLabel } from "@domain/rules/blindFormat";
import {
  getPlayLevelCount,
  isClockFinished,
  isFinalPlayLevel,
} from "@domain/rules/blindProgression";
import { calculatePayouts, hasPayouts } from "@domain/rules/payouts";
import { calculatePrizePoolForTournament } from "@domain/rules/prizePool";
import { computeTournamentStats } from "@domain/rules/tournamentStats";
import { getEntryPriceLines } from "@domain/rules/entryPricing";
import { secondsToMinutes } from "@domain/rules/duration";
import {
  finishTournament,
  startTournament,
  stopTournament,
} from "@domain/rules/tournamentLifecycle";
import { DEFAULT_SOUND_SETTINGS } from "@domain/entities";
import {
  formatMoney,
  formatClock,
  formatCompactNumber,
  formatDurationHMS,
  formatNumber,
  formatAmount,
} from "@domain/rules/format";
import { copyProjectorLink } from "../../shared/projectorLink";
import Screen from "../../components/layout/Screen";
import TopBar, { BackLink, BarTitle } from "../../components/layout/TopBar";
import TournamentDock from "../../components/layout/TournamentDock";
import Toast from "../../components/Toast";
import ConfirmDialog from "../../components/ConfirmDialog";
import ClockDial from "../../components/clock/ClockDial";
import {
  CameraIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LinkIcon,
  PauseIcon,
  PlayIcon,
  ResetIcon,
  SpeakerIcon,
  SpeakerOffIcon,
  StopIcon,
} from "../../components/icons";
import type { BlindLevel, PayoutStructure } from "@domain/entities";
import ProjectorView from "../../components/projector/ProjectorView";
import ProjectorCaptureFrame, {
  type ProjectorCaptureFrameHandle,
} from "../../components/projector/ProjectorCaptureFrame";
import BlindStat from "./sections/BlindStat";
import PageShell from "./sections/PageShell";

/** Ante reads as "<BB> BBA" in big-blind-ante format, the number when there is one, else a dash. */
function anteText(level: BlindLevel): string {
  if (level.isBigBlindAnte) return `${formatCompactNumber(level.bigBlind)} BBA`;
  return level.ante > 0 ? formatCompactNumber(level.ante) : "–";
}

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
  const [isCapturing, setIsCapturing] = useState(false);
  const [confirmingStop, setConfirmingStop] = useState(false);
  const captureFrameRef = useRef<ProjectorCaptureFrameHandle>(null);
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

  // Once the final level's clock reaches zero the run is over — persist the
  // 'finished' status so it reflects everywhere (dashboard badge included).
  // The status guard keeps this from re-firing on every subsequent tick.
  useEffect(() => {
    if (!tournament || !structure || !currentLevel) return;
    if (
      isClockFinished(structure, currentLevel, secondsRemaining) &&
      tournament.status !== "finished"
    ) {
      void saveTournament(finishTournament(tournament));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsRemaining, currentLevel, structure, tournament?.status]);

  if (!tournamentsLoaded) {
    return <PageShell>Loading…</PageShell>;
  }

  if (!tournament || !id) {
    return (
      <PageShell>
        <p>Tournament not found.</p>
        <Link to="/" className="btn btn-secondary mt-4">
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
  const priceLine = `${entryPriceLines
    .map((line) => line.label)
    .join("/")} : ${entryPriceLines
    .map((line) => formatAmount(line.amountCents))
    .join("/")}`;

  const {
    totalRegistered,
    remainingPlayers,
    buyInCount,
    rebuyCount,
    totalEntries,
    totalStack,
    avgStack,
    startingStack,
  } = computeTournamentStats(tournament);
  const backgroundPath = resolveBackgroundPath(tournament.projectorBackgroundId);

  const isBreak = currentLevel?.isBreak ?? false;
  // Breaks are not levels — count and number only play levels.
  const playLevelCount = getPlayLevelCount(structure);
  const isFinalLevel = currentLevel
    ? isFinalPlayLevel(structure, currentLevel)
    : false;
  // The tournament is over once the final level's clock has run out.
  const isFinished = currentLevel
    ? isClockFinished(structure, currentLevel, secondsRemaining)
    : false;
  const isLowTime = secondsRemaining <= 60 && secondsRemaining > 0 && !isBreak;

  const levelLabel = !currentLevel
    ? ""
    : isBreak
      ? formatLevelLabel(currentLevel)
      : isFinished
        ? "Finished"
        : isFinalLevel
          ? "Final Level"
          : `Level ${currentLevel.level} of ${playLevelCount}`;
  const levelPillClass = isBreak
    ? "bg-break/10 text-break-text"
    : isFinished || isFinalLevel
      ? "bg-accent/15 text-[#FFE59A]"
      : "";

  async function handleStart() {
    if (!id) return;
    start(id, Date.now());
    await saveTournament(startTournament(tournament!));
  }

  async function handleConfirmStop() {
    setConfirmingStop(false);
    await stopClock();
    await saveTournament(stopTournament(tournament!));
  }

  async function handleCapture() {
    const frame = captureFrameRef.current;
    if (!frame || isCapturing) return;
    setIsCapturing(true);
    try {
      showToast(await frame.capture(tournament!.name));
    } finally {
      setIsCapturing(false);
    }
  }

  return (
    <Screen>
      <TopBar tone="rail">
        <BackLink to="/" label="All tournaments" />
        <BarTitle title={tournament.name} subtitle={priceLine} />
        {tournament.joinCode && (
          <span className="plate ml-auto text-[16px] text-accent-lift">
            {tournament.joinCode}
          </span>
        )}
        <button
          type="button"
          className={`btn btn-icon btn-quiet ${tournament.joinCode ? "" : "ml-auto"}`}
          title="Copy projector link"
          aria-label="Copy projector link"
          onClick={handleCopyProjectorLink}
        >
          <LinkIcon className="size-[17px]" />
        </button>
        <button
          type="button"
          className="btn btn-icon btn-quiet"
          title="Capture projector image"
          aria-label="Capture projector image"
          onClick={handleCapture}
          disabled={!currentLevel || isCapturing}
        >
          <CameraIcon className="size-[17px]" />
        </button>
      </TopBar>

      <div className="scroll felt flex flex-col">
        {!clock ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-[18px] px-5 py-10">
            <p className="display text-[29px] text-muted">Ready when you are.</p>
            <button
              type="button"
              className="btn btn-primary h-14 px-[30px] text-[20px]"
              onClick={handleStart}
            >
              <PlayIcon className="size-[18px]" />
              Start Tournament
            </button>
          </div>
        ) : currentLevel ? (
          <div className="content flex flex-auto flex-col items-center gap-[13px] px-4 pt-3.5 pb-5">
            <div className="grid w-full grid-cols-3 gap-[9px]">
              <Link
                to={`/tournament/${id}/players`}
                className="slab flex flex-col items-center gap-[3px] rounded-2xl px-2 py-[11px] text-inherit no-underline"
              >
                <span className="text-[14px] text-muted">Players</span>
                <span className="engrave display text-[24px] tabular-nums">
                  {formatNumber(remainingPlayers)}
                  <span className="text-[16px] text-faint">
                    {" "}
                    / {formatNumber(totalRegistered)}
                  </span>
                </span>
              </Link>

              <div className="slab flex flex-col items-center gap-[3px] rounded-2xl px-2 py-[11px]">
                <span className="text-[14px] text-muted">Prize Pool</span>
                <span className="display text-[24px] tabular-nums text-accent">
                  {formatMoney(prizePool, currency)}
                </span>
              </div>

              <div className="slab flex flex-col items-center gap-[3px] rounded-2xl px-2 py-[11px]">
                <span className="text-[14px] text-muted">Average Stack</span>
                <span className="engrave display text-[24px] tabular-nums">
                  {formatNumber(Math.round(avgStack))}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-x-[15px] gap-y-[3px] text-[18px] text-muted">
              <span>
                Total Entries <b className="engrave display">{formatNumber(totalEntries)}</b>
              </span>
              <span>
                Re-buy <b className="engrave display">{formatNumber(rebuyCount)}</b>
              </span>
              <span>
                Buy-in <b className="engrave display">{formatNumber(buyInCount)}</b>
              </span>
              <span>
                Total Stack <b className="engrave display">{formatNumber(totalStack)}</b>
              </span>
            </div>

            <div className="w-full text-center">
              <h1 className="engrave truncate text-[28px]">{tournament.name}</h1>
              <p className="mt-px text-[18px] text-faint">{priceLine}</p>
            </div>

            <div className="flex flex-col items-center gap-[5px]">
              <span className={`tag px-3 py-[5px] text-[18px] ${levelPillClass}`}>{levelLabel}</span>
              {isBreak && currentLevel.chipRace && (
                <span className="text-[14px] tracking-[.16em] uppercase text-break">
                  {formatChipRaceLabel(currentLevel)}
                </span>
              )}
            </div>

            <ClockDial
              key={`${activeLevelIndex}${isFinished ? "f" : ""}${clock.isPaused ? "p" : ""}`}
              secondsRemaining={secondsRemaining}
              durationSeconds={currentLevel.durationSeconds}
              isPaused={clock.isPaused}
              isFinished={isFinished}
              isBreak={isBreak}
              isLowTime={isLowTime}
              announce={`${levelLabel}, ${
                isFinished ? "finished" : clock.isPaused ? "paused" : formatClock(secondsRemaining)
              }`}
              caption={
                isFinished
                  ? "tournament complete"
                  : isBreak
                    ? "break remaining"
                    : `of ${secondsToMinutes(currentLevel.durationSeconds)} min`
              }
            />

            {!isBreak && (
              <div className="flex items-end justify-center gap-3">
                <BlindStat
                  label="Small blind"
                  value={formatCompactNumber(currentLevel.smallBlind)}
                />
                <span className="pb-1 text-[25px] text-faint">/</span>
                <BlindStat label="Big blind" value={formatCompactNumber(currentLevel.bigBlind)} />
                <span className="pb-1 text-[25px] text-faint">+</span>
                <BlindStat
                  label="Ante"
                  value={anteText(currentLevel)}
                  tone={currentLevel.isBigBlindAnte || currentLevel.ante > 0 ? "accent" : "faint"}
                />
              </div>
            )}

            {nextLevel && (
              <div className="sunken w-full px-3.5 pt-[11px] pb-3">
                <div className="kicker mb-1.5 text-center text-muted">Next level</div>
                {nextLevel.isBreak ? (
                  <div className="display text-center text-[22px] text-break">
                    {formatLevelLabel(nextLevel)}
                  </div>
                ) : (
                  <div className="flex items-end justify-center gap-2.5">
                    <BlindStat
                      label="Small blind"
                      value={formatCompactNumber(nextLevel.smallBlind)}
                      small
                    />
                    <span className="pb-0.5 text-[22px] text-faint">/</span>
                    <BlindStat
                      label="Big blind"
                      value={formatCompactNumber(nextLevel.bigBlind)}
                      small
                    />
                    <span className="pb-0.5 text-[22px] text-faint">+</span>
                    <BlindStat
                      label="Ante"
                      value={anteText(nextLevel)}
                      small
                      tone={nextLevel.isBigBlindAnte || nextLevel.ante > 0 ? "accent" : "faint"}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="text-[16px] text-muted">
              Next Break{" "}
              <b className="engrave display tabular-nums">
                {nextBreakSeconds != null ? formatDurationHMS(nextBreakSeconds) : "—"}
              </b>
            </div>

            <div className="flex items-center justify-center gap-6 py-0.5">
              <button
                type="button"
                className="chip chip-slate size-14"
                disabled={clock.currentLevelIndex === 0}
                onClick={() => jump(clock.currentLevelIndex - 1, Date.now())}
                title="Previous level"
                aria-label="Previous level"
              >
                <ChevronLeftIcon className="size-[22px]" />
              </button>

              <button
                type="button"
                className="chip chip-gold size-22"
                onClick={() => (clock.isPaused ? resume(Date.now()) : pause(Date.now()))}
                aria-label={clock.isPaused ? "Resume" : "Pause"}
              >
                {clock.isPaused ? (
                  <PlayIcon className="size-8" />
                ) : (
                  <PauseIcon className="size-8" />
                )}
              </button>

              <button
                type="button"
                className="chip chip-slate size-14"
                disabled={clock.currentLevelIndex >= structure.levels.length - 1}
                onClick={() => jump(clock.currentLevelIndex + 1, Date.now())}
                title="Next level"
                aria-label="Next level"
              >
                <ChevronRightIcon className="size-[22px]" />
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-1.5">
              <button
                type="button"
                className="btn btn-secondary min-h-[38px]"
                onClick={() => adjustTime(-60)}
              >
                −1m
              </button>
              <button
                type="button"
                className="btn btn-secondary min-h-[38px]"
                onClick={() => adjustTime(60)}
              >
                +1m
              </button>
              <button
                type="button"
                className="btn btn-secondary min-h-[38px]"
                onClick={() => adjustTime(300)}
              >
                +5m
              </button>
              <button
                type="button"
                className="btn btn-secondary min-h-[38px]"
                disabled={history.length === 0}
                onClick={undo}
              >
                <ResetIcon className="size-4" />
                Undo
              </button>
              <button
                type="button"
                className="btn btn-secondary min-h-[38px]"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <SpeakerOffIcon className="size-4" />
                ) : (
                  <SpeakerIcon className="size-4" />
                )}
                {isMuted ? "Unmute" : "Mute"}
              </button>
            </div>

            <button
              type="button"
              className={`btn mt-1.5 h-[46px] w-full text-[20px] ${
                isFinished ? "btn-primary" : "btn-danger"
              }`}
              onClick={() => setConfirmingStop(true)}
            >
              {isFinished ? (
                <ResetIcon className="size-[17px]" />
              ) : (
                <StopIcon className="size-[17px]" />
              )}
              {isFinished ? "Reset Tournament" : "Stop Tournament"}
            </button>
          </div>
        ) : null}
      </div>

      <TournamentDock tournamentId={id} />

      <ConfirmDialog
        open={confirmingStop}
        title={isFinished ? "Reset tournament?" : "Stop tournament?"}
        message={
          isFinished
            ? "The clock returns to Level 1 and player counters are cleared. The blind structure is kept."
            : "The live clock is cleared on every screen, including the projector, and counters are reset. Stopping means starting over, not pausing."
        }
        confirmLabel={isFinished ? "Reset" : "Stop"}
        tone={isFinished ? "primary" : "danger"}
        onConfirm={handleConfirmStop}
        onCancel={() => setConfirmingStop(false)}
      />

      {/* Hosts the projector layout in a hidden 1920×1080 iframe so the capture
          is a faithful HD image regardless of the device that triggered it. */}
      {currentLevel && (
        <ProjectorCaptureFrame ref={captureFrameRef}>
          <ProjectorView
            tournamentName={tournament.name}
            currency={currency}
            backgroundPath={backgroundPath}
            entryPriceLines={entryPriceLines}
            startingStack={startingStack}
            prizePool={prizePool}
            payoutResults={payoutResults}
            currentLevel={currentLevel}
            nextLevel={nextLevel}
            secondsRemaining={secondsRemaining}
            isPaused={clock?.isPaused ?? false}
            isFinished={isFinished}
            remainingPlayers={remainingPlayers}
            totalRegistered={totalRegistered}
            totalEntries={totalEntries}
            rebuyCount={rebuyCount}
            totalStack={totalStack}
            avgStack={avgStack}
            nextBreakSeconds={nextBreakSeconds}
          />
        </ProjectorCaptureFrame>
      )}

      <Toast message={toastMessage} />
    </Screen>
  );
}
