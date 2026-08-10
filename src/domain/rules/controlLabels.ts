import type { BlindLevel, BlindStructure, EntryPriceLine } from '../entities';
import { BIG_BLIND_ANTE_SUFFIX, EMPTY_FIGURE } from '../constants/tournament';
import { LOW_TIME_SECONDS } from '../constants/projector';
import { getPlayLevelCount, isClockFinished, isFinalPlayLevel } from './blindProgression';
import { formatLevelLabel } from './blindFormat';
import { secondsToMinutes } from './duration';
import { formatAmount, formatClock, formatCompactNumber } from './format';

/**
 * Which of the four states the level pill is in. The control page maps this to
 * colours; deciding which state applies is a tournament rule, so a screen never
 * has to re-derive "is this the last one" from the structure itself.
 */
export type ControlLevelState = 'break' | 'finished' | 'final' | 'normal';

export interface ControlLabels {
  isBreak: boolean;
  /** The final level's clock has run out — the tournament is over. */
  isFinished: boolean;
  /** Under a minute left on a play level. */
  isLowTime: boolean;
  levelState: ControlLevelState;
  /** "Level 4 of 12", the break's name, "Final Level" or "Finished". */
  levelLabel: string;
  /** Read out by screen readers in place of the silently-ticking digits. */
  clockAnnouncement: string;
  /** Quiet line under the dial's digits. */
  clockCaption: string;
}

/**
 * Every label and state flag the control screen shows for the level it's on.
 *
 * These read as formatting but they aren't: which level counts as the final
 * one, when a run is finished and when time is "low" are all rules the
 * projector already answers the same way. Deriving them here is what keeps the
 * control screen and the TV in front of the players from disagreeing.
 */
export function buildControlLabels(
  structure: BlindStructure,
  currentLevel: BlindLevel | undefined,
  secondsRemaining: number,
  isPaused: boolean,
): ControlLabels {
  const isBreak = currentLevel?.isBreak ?? false;
  const isFinished = currentLevel
    ? isClockFinished(structure, currentLevel, secondsRemaining)
    : false;
  const isFinalLevel = currentLevel ? isFinalPlayLevel(structure, currentLevel) : false;
  const isLowTime = !isBreak && secondsRemaining > 0 && secondsRemaining <= LOW_TIME_SECONDS;

  const levelState: ControlLevelState = isBreak
    ? 'break'
    : isFinished
      ? 'finished'
      : isFinalLevel
        ? 'final'
        : 'normal';

  // Breaks are not levels — the "of N" count numbers only play levels.
  const levelLabel = !currentLevel
    ? ''
    : isBreak
      ? formatLevelLabel(currentLevel)
      : isFinished
        ? 'Finished'
        : isFinalLevel
          ? 'Final Level'
          : `Level ${currentLevel.level} of ${getPlayLevelCount(structure)}`;

  const clockState = isFinished ? 'finished' : isPaused ? 'paused' : formatClock(secondsRemaining);

  return {
    isBreak,
    isFinished,
    isLowTime,
    levelState,
    levelLabel,
    clockAnnouncement: `${levelLabel}, ${clockState}`,
    clockCaption: isFinished
      ? 'tournament complete'
      : isBreak
        ? 'break remaining'
        : currentLevel
          ? `of ${secondsToMinutes(currentLevel.durationSeconds)} min`
          : '',
  };
}

/** Ante reads as "<BB> BBA" in big-blind-ante format, the number when there is one, else a dash. */
export function formatAnte(level: BlindLevel): string {
  if (level.isBigBlindAnte) {
    return `${formatCompactNumber(level.bigBlind)} ${BIG_BLIND_ANTE_SUFFIX}`;
  }
  return level.ante > 0 ? formatCompactNumber(level.ante) : EMPTY_FIGURE;
}

/** The level has an ante of some kind, so it's worth drawing in the accent tone. */
export function hasAnte(level: BlindLevel): boolean {
  return level.isBigBlindAnte || level.ante > 0;
}

/** "Buyin/Rebuy : $20/$20" — the entry prices as one line for a title bar. */
export function formatEntryPriceSummary(lines: EntryPriceLine[]): string {
  const labels = lines.map((line) => line.label).join('/');
  const amounts = lines.map((line) => formatAmount(line.amountCents)).join('/');
  return `${labels} : ${amounts}`;
}
