import { useEffect, useRef } from 'react';
import type { BlindLevel, BlindStructure, SoundSettings } from '@domain/entities';
import { playSound } from '@composition/container';

interface UseClockSoundsArgs {
  structure: BlindStructure | undefined;
  /** The level currently showing (from time-based rollover, not the stored index). */
  currentLevel: BlindLevel | undefined;
  /** The effective active level index — sounds fire when this changes. */
  activeLevelIndex: number;
  secondsRemaining: number;
  sounds: SoundSettings;
  /** When true, suppress all playback (the control screen's mute toggle). */
  muted?: boolean;
}

const WARNING_THRESHOLDS: [seconds: number, key: keyof SoundSettings][] = [
  [60, 'warning60s'],
  [30, 'warning30s'],
  [10, 'warning10s'],
  [5, 'warning5s'],
];

/**
 * Plays the tournament's configured sounds on clock events — level/break
 * transitions and the 60/30/10/5-second warnings. Shared by the Control and
 * Projector screens so both make sound (a TV showing only the projector still
 * plays the alerts). Keys off the effective active level so it fires even when
 * a level rolls over without the control screen writing the advance.
 */
export function useClockSounds({
  structure,
  currentLevel,
  activeLevelIndex,
  secondsRemaining,
  sounds,
  muted = false,
}: UseClockSoundsArgs): void {
  const previousLevelIndexRef = useRef<number | null>(null);
  const warnedThresholdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!structure || !currentLevel) return;
    if (previousLevelIndexRef.current === null) {
      previousLevelIndexRef.current = activeLevelIndex;
      return;
    }
    if (previousLevelIndexRef.current === activeLevelIndex) return;

    const previousLevel = structure.levels[previousLevelIndexRef.current];
    previousLevelIndexRef.current = activeLevelIndex;
    warnedThresholdsRef.current = new Set(); // fresh warnings for the new level

    if (muted) return;
    if (currentLevel.isBreak) {
      playSound(sounds.breakStart);
    } else if (previousLevel?.isBreak) {
      playSound(sounds.breakEnd);
    } else {
      playSound(sounds.nextLevel);
    }
  }, [structure, currentLevel, activeLevelIndex, muted, sounds]);

  useEffect(() => {
    if (muted || !currentLevel) return;
    for (const [seconds, key] of WARNING_THRESHOLDS) {
      if (
        secondsRemaining <= seconds &&
        secondsRemaining > seconds - 1 &&
        !warnedThresholdsRef.current.has(seconds)
      ) {
        warnedThresholdsRef.current.add(seconds);
        playSound(sounds[key]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.ceil(secondsRemaining)]);
}
