import { useEffect, useRef, useState } from "react";
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
import { isClockFinished } from "@domain/rules/blindProgression";
import { getEntryPriceLines } from "@domain/rules/entryPricing";
import { calculatePrizePoolForTournament } from "@domain/rules/prizePool";
import { computeTournamentStats } from "@domain/rules/tournamentStats";
import { buildProjectorData } from "@domain/rules/projectorData";
import {
  buildControlLabels,
  formatAnte,
  formatEntryPriceSummary,
  hasAnte,
} from "@domain/rules/controlLabels";
import {
  finishTournament,
  openRegistration,
  startTournament,
  stopTournament,
} from "@domain/rules/tournamentLifecycle";
import { getRegistrationWindow, getSchedulePhase } from "@domain/rules/tournamentSchedule";
import { DEFAULT_SOUND_SETTINGS } from "@domain/entities";
import { DEFAULT_CURRENCY } from "@domain/constants/tournament";
import {
  formatMoney,
  formatCompactNumber,
  formatDurationHMS,
  formatNumber,
} from "@domain/rules/format";
import { copyProjectorLink } from "@application/shared/projectorLink";
import Screen from "@application/components/template/Screen";
import TopBar from "@application/components/template/TopBar";
import BackLink from "@application/components/template/TopBar/sections/BackLink";
import BarTitle from "@application/components/template/TopBar/sections/BarTitle";
import TournamentDock from "@application/components/template/TournamentDock";
import Toast from "@application/components/ui/Toast";
import ConfirmDialog from "@application/components/ui/ConfirmDialog";
import ClockDial from "@application/components/shared/ClockDial";
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
} from "@application/components/ui/icons";
import ProjectorView from "@application/components/template/ProjectorView";
import ProjectorCaptureFrame, {
  type ProjectorCaptureFrameHandle,
} from "@application/components/template/ProjectorCaptureFrame";
import BlindStat from "./sections/BlindStat";
import PageShell from "./sections/PageShell";
import { LEVEL_PILL_CLASSES, TIME_ADJUSTMENTS } from "./constants";

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

  const sounds = tournament?.sounds ?? DEFAULT_SOUND_SETTINGS;
  const currency = tournament?.currency ?? DEFAULT_CURRENCY;

  const {
    structure,
    clock,
    isClockDerived,
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
    if (!clock || isClockDerived || !structure || !id) return;
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

  // A scheduled tournament does not wait for this screen. Its clock is derived
  // from the start time, so it is already running on the TV before anyone opens
  // the app — which is the only way a scheduled start is any use.
  //
  // What is left for this screen is bookkeeping, and both halves are idempotent:
  // adopt the derived clock into a real row, so the operator's own controls
  // (pause, jump, adjust) have something to write to and the run survives a
  // reload; and record the status the dashboard reads.
  useEffect(() => {
    if (!tournament || !id) return;

    if (isClockDerived && clock) {
      // Started at the scheduled instant, not now, so adopting it doesn't
      // rewind the countdown the room has been watching.
      start(id, clock.levelStartedAtEpochMs);
      void saveTournament(startTournament(tournament));
      return;
    }
    if (
      !clock &&
      tournament.status === "setup" &&
      getSchedulePhase(tournament, now) === "registering"
    ) {
      void saveTournament(openRegistration(tournament));
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
        <Link to="/" className="btn btn-secondary mt-4">
          Back to dashboard
        </Link>
      </PageShell>
    );
  }

  if (!structure) {
    return <PageShell>Loading blind structure…</PageShell>;
  }

  // Only meaningful before the clock exists — once it does, the level clock is
  // the thing on screen.
  const registration = clock ? undefined : getRegistrationWindow(tournament, now);

  const prizePool = calculatePrizePoolForTournament(tournament);
  const priceLine = formatEntryPriceSummary(getEntryPriceLines(tournament));

  const { totalRegistered, remainingPlayers, buyInCount, rebuyCount, totalEntries, totalStack, avgStack } =
    computeTournamentStats(tournament);

  const {
    isBreak,
    isFinished,
    isLowTime,
    levelState,
    levelLabel,
    clockAnnouncement,
    clockCaption,
  } = buildControlLabels(structure, currentLevel, secondsRemaining, clock?.isPaused ?? false);

  async function handleStart() {
    if (!id) return;
    start(id, Date.now());
    await saveTournament(startTournament(tournament!));
  }

  async function handleConfirmStop() {
    setConfirmingStop(false);
    // The schedule goes first: it is what a derived clock is built from, so
    // clearing the clock while the start time is still set would only have the
    // clock derive itself straight back on the next tick.
    await saveTournament(stopTournament(tournament!));
    await stopClock();
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
            {registration ? (
              <>
                <p className="kicker text-status-registering text-2xl font-bold">Registering</p>
                {registration.secondsRemaining != null ? (
                  <>
                    <p className="engrave display text-[52px] tabular-nums">
                      {formatDurationHMS(registration.secondsRemaining)}
                    </p>
                   
                  </>
                ) : (
                  <p className="text-[18px] text-muted">
                    Start the tournament when you're ready.
                  </p>
                )}
              </>
            ) : (
              <p className="display text-[29px] text-muted">Ready when you are.</p>
            )}
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
              <span className={`tag px-3 py-[5px] text-[18px] ${LEVEL_PILL_CLASSES[levelState]}`}>
                {levelLabel}
              </span>
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
              announce={clockAnnouncement}
              caption={clockCaption}
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
                  value={formatAnte(currentLevel)}
                  tone={hasAnte(currentLevel) ? "accent" : "faint"}
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
                      value={formatAnte(nextLevel)}
                      small
                      tone={hasAnte(nextLevel) ? "accent" : "faint"}
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
              {TIME_ADJUSTMENTS.map(({ label, seconds }) => (
                <button
                  key={label}
                  type="button"
                  className="btn btn-secondary min-h-[38px]"
                  onClick={() => adjustTime(seconds)}
                >
                  {label}
                </button>
              ))}
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
            {...buildProjectorData(
              tournament,
              {
                structure,
                currentLevel,
                nextLevel,
                secondsRemaining,
                nextBreakSeconds,
                activeLevelIndex,
                isPaused: clock?.isPaused ?? false,
                isFinished,
              },
              resolveBackgroundPath(tournament.projectorBackgroundId),
            )}
          />
        </ProjectorCaptureFrame>
      )}

      <Toast message={toastMessage} />
    </Screen>
  );
}
