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
import { buildProjectorData } from "@domain/rules/projectorData";
import { isTournamentFinished } from "@domain/rules/tournamentLifecycle";
import { getRegistrationWindow } from "@domain/rules/tournamentSchedule";
import ProjectorView from "@application/components/template/ProjectorView";
import type { TournamentClock } from "@application/hooks/useTournamentClock";
import type { ProjectorData, TournamentConfig } from "@domain/entities";
import Centered from "./sections/Centered";
import { REFRESH_INTERVAL_MS } from "./constants";

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

  const live = useTournamentClock(tournament);
  const { structure, currentLevel, secondsRemaining, activeLevelIndex } = live;

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

  const projectorData = buildScreen(tournament, live);

  if (!projectorData) {
    return <Centered>{tournament.name} — waiting for clock to start</Centered>;
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <ProjectorView {...projectorData} />

      {needsSoundUnlock && (
        <button
          type="button"
          onClick={enableSound}
          className="absolute inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-4 border-0 bg-base-deep/80 text-fg backdrop-blur-sm"
          aria-label="Tap to enable sound"
        >
          <span className="text-[clamp(3rem,8vw,6rem)]">🔊</span>
          <span className="display font-semibold text-[clamp(1.25rem,3vw,2.5rem)]">
            Tap to enable sound
          </span>
        </button>
      )}
    </div>
  );
}

/**
 * What the TV is showing: the live screen once the clock is running, or — before
 * it starts — the registration board, drawn from the level play will open on
 * rather than one that is under way.
 *
 * The registration board is derived here from the tournament's own schedule
 * rather than read off its persisted status, so the TV counts down on time even
 * when nobody has the control screen open.
 *
 * Null when neither applies: no clock, and no registration window either.
 */
function buildScreen(
  tournament: TournamentConfig,
  live: TournamentClock,
): ProjectorData | null {
  const backgroundPath = resolveBackgroundPath(tournament.projectorBackgroundId);
  const { structure, clock, currentLevel, secondsRemaining } = live;

  if (clock && currentLevel) {
    return buildProjectorData(
      tournament,
      {
        structure,
        currentLevel,
        nextLevel: live.nextLevel,
        secondsRemaining,
        nextBreakSeconds: live.nextBreakSeconds,
        activeLevelIndex: live.activeLevelIndex,
        isPaused: clock.isPaused,
        isFinished: structure
          ? isTournamentFinished(tournament.status, structure, currentLevel, secondsRemaining)
          : false,
      },
      backgroundPath,
    );
  }

  const registration = getRegistrationWindow(tournament, live.now);
  const openingLevel = tournament.blindLevels[0];
  if (!registration || !openingLevel) return null;

  return buildProjectorData(
    tournament,
    {
      structure,
      currentLevel: openingLevel,
      nextLevel: undefined,
      secondsRemaining: 0,
      nextBreakSeconds: null,
      activeLevelIndex: 0,
      isPaused: false,
      isFinished: false,
      registration,
    },
    backgroundPath,
  );
}
