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
import { buildTournamentScreen } from "@domain/rules/projectorData";
import ProjectorView from "@application/components/template/ProjectorView";
import type { TournamentConfig } from "@domain/entities";
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

  const live = useTournamentClock(tournament, {
    canStartFromSchedule: tournament?.scheduleStartAllowed !== false,
  });
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

  const projectorData = buildTournamentScreen(
    tournament,
    live,
    resolveBackgroundPath(tournament.projectorBackgroundId),
  );

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
