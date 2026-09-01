import type { BlindLevel, PayoutResult, ProjectorData } from '../entities';
import { LOW_TIME_SECONDS, MEDAL_PLACES, PRICE_LINE_SEPARATOR } from '../constants/projector';
import {
  formatBlinds,
  formatBlindsLine,
  formatChipRaceLabel,
  formatLevelLabel,
} from './blindFormat';
import {
  formatCompactAmount,
  formatClock,
  formatCompactNumber,
  formatDurationHMS,
  formatNumber,
} from './format';
import { formatPayoutCash, formatPayoutPlace, groupPayoutResults } from './payouts';
import { formatRegistrationEnd } from './tournamentSchedule';

/**
 * What the countdown is doing, as one value rather than a set of flags.
 *
 * Layouts ask for `running` positively and never for the absence of a
 * particular halt. A status added to this union later — a chip race, a
 * scheduled stop, a lost sync — then reads as "not counting" everywhere it
 * hasn't been thought about yet, instead of slipping through a `!isPaused`
 * test as though the clock were still ticking.
 */
export type ProjectorClockStatus = 'registering' | 'running' | 'paused' | 'finished';

/** What the level heading reads while the doors are open. */
export const REGISTERING_LABEL = 'Registering';

/**
 * Which of the three moods the screen is in. The layers above turn this into
 * colours; the rule of which mood applies belongs here, so every surface agrees
 * on when a tournament is "running out" without each one re-deriving it.
 */
export type ProjectorTone = 'normal' | 'break' | 'low';

export interface ProjectorStat {
  label: string;
  value: string;
}

export interface ProjectorPayoutRow {
  place: string;
  value: string;
  /** Index among the medal places, or -1 for the rest of the field. */
  medalIndex: number;
}

export interface ProjectorBlinds {
  sb: string;
  bb: string;
  anteNumber: string;
  anteUnit: string;
  ante: string;
}

/**
 * Everything the layouts need that isn't already in `ProjectorData`, derived
 * once so all four arrangements label and format the same numbers identically.
 *
 * Every field is a string, a number or a flag. Colours, shadows and pip styles
 * are the layouts' business and are mapped from `tone` up there — the domain
 * decides what state the tournament is in, not what gold looks like.
 */
export interface ProjectorModel {
  isBreak: boolean;
  isLowTime: boolean;
  isFinished: boolean;
  tone: ProjectorTone;
  clockStatus: ProjectorClockStatus;
  /** The countdown is actually ticking — the only state a progress indicator
   *  should be drawn in. Read this rather than negating a halt. */
  isRunning: boolean;
  /** 0…1 of the current level already elapsed — drives the rail and the dial. */
  elapsedFraction: number;
  levelLabel: string;
  chipRaceLine: string;
  clockText: string;
  /** Changes on every level change, so a layout can re-key its clock to replay the animation. */
  levelKey: string;
  showBlinds: boolean;
  blinds: ProjectorBlinds;
  blindsText: string;
  priceLine: string;
  /** "Reg End: Level 8 ( 20h30 )", printed under the price line. Empty when the
   *  tournament doesn't announce one. */
  regEndLine: string;
  nextText: string;
  stats: ProjectorStat[];
  payouts: ProjectorPayoutRow[];
}

export function buildProjectorModel(data: ProjectorData): ProjectorModel {
  const {
    currentLevel,
    nextLevel,
    secondsRemaining,
    isPaused,
    isFinished = false,
    registration,
    entryPriceLines,
    startingStack,
  } = data;

  // Registration comes before a level clock exists, so it outranks every other
  // state here — there is nothing yet for the tournament to be paused from.
  const isRegistering = Boolean(registration) && !isFinished;
  const clockStatus: ProjectorClockStatus = isFinished
    ? 'finished'
    : isRegistering
      ? 'registering'
      : isPaused
        ? 'paused'
        : 'running';

  // Registration always has a start to count down to now — it can only be
  // opened inside the lead window before one. That window is hours long, so the
  // countdown grows an hours field rather than reading "360:00"; a level clock
  // never needs one and keeps the tighter mm:ss.
  const registrationSeconds = isRegistering ? (registration?.secondsRemaining ?? 0) : 0;
  const registrationText =
    registrationSeconds >= 3600
      ? formatDurationHMS(registrationSeconds)
      : formatClock(registrationSeconds);

  // Nothing about the blind structure applies until the clock starts, so a
  // registering screen stays in the plain tone however short the countdown gets.
  const isBreak = !isRegistering && currentLevel.isBreak;
  const isLowTime =
    !isRegistering &&
    !isBreak &&
    !isFinished &&
    secondsRemaining > 0 &&
    secondsRemaining <= LOW_TIME_SECONDS;

  const duration = Math.max(1, currentLevel.durationSeconds);
  const elapsedFraction = isRegistering
    ? (registration?.elapsedFraction ?? 0)
    : isFinished
      ? 1
      : Math.min(1, Math.max(0, 1 - secondsRemaining / duration));

  const { anteNumber, anteUnit } = anteParts(currentLevel);

  return {
    isBreak,
    isLowTime,
    isFinished,
    tone: isLowTime ? 'low' : isBreak ? 'break' : 'normal',
    clockStatus,
    isRunning: isRegistering || clockStatus === 'running',
    elapsedFraction,
    levelLabel: isFinished
      ? 'Finished'
      : isRegistering
        ? REGISTERING_LABEL
        : formatLevelLabel(currentLevel),
    chipRaceLine: isBreak && currentLevel.chipRace ? formatChipRaceLabel(currentLevel) : '',
    clockText: isFinished
      ? 'FINISHED'
      : isRegistering
        ? registrationText
        : isPaused
          ? 'PAUSED'
          : formatClock(secondsRemaining),
    levelKey: `${currentLevel.level}${currentLevel.isBreak ? 'b' : ''}${isFinished ? 'f' : ''}${
      isPaused ? 'p' : ''
    }${isRegistering ? 'r' : ''}`,
    // Play hasn't opened yet, so there are no blinds in force — the opening
    // level is announced as what's coming, on the "next" line, not as the
    // current one.
    showBlinds: !isRegistering && !isBreak,
    blinds: {
      sb: formatCompactNumber(currentLevel.smallBlind),
      bb: formatCompactNumber(currentLevel.bigBlind),
      anteNumber,
      anteUnit,
      ante: anteUnit ? `${anteNumber} ${anteUnit}` : anteNumber,
    },
    blindsText: formatBlinds(currentLevel),
    priceLine: buildPriceLine(entryPriceLines, startingStack),
    regEndLine: formatRegistrationEnd(data.lateRegLevel, data.regEndTime),
    // While registering, `currentLevel` is the level play will open on rather
    // than one under way — which makes it precisely what "next" means here.
    nextText: buildNextText(isRegistering ? currentLevel : nextLevel),
    stats: buildStats(data),
    payouts: buildPayouts(data.payoutResults),
  };
}

function anteParts(level: BlindLevel): { anteNumber: string; anteUnit: string } {
  if (level.isBigBlindAnte) {
    return { anteNumber: formatCompactNumber(level.bigBlind), anteUnit: 'BBA' };
  }
  return { anteNumber: level.ante > 0 ? formatCompactNumber(level.ante) : '—', anteUnit: '' };
}

/** The buy-in and re-buy prices followed by the starting stack, on one line. */
function buildPriceLine(entryPriceLines: ProjectorData['entryPriceLines'], startingStack: number) {
  return [
    ...entryPriceLines.map((line) => `${line.label} ${formatCompactAmount(line.amountCents)}`),
    `Stack ${formatNumber(startingStack)}`,
  ].join(PRICE_LINE_SEPARATOR);
}

/** Slash-joined small/big/ante of what comes next, or the name of the break. */
function buildNextText(nextLevel: BlindLevel | undefined): string {
  if (!nextLevel) return 'Last level';
  return nextLevel.isBreak
    ? `Next: ${formatLevelLabel(nextLevel)}`
    : `Next: ${formatBlindsLine(nextLevel)}`;
}

/** The same six figures the classic layout shows, in the same order. */
function buildStats(data: ProjectorData): ProjectorStat[] {
  return [
    {
      label: 'Players',
      value: `${formatNumber(data.remainingPlayers)} / ${formatNumber(data.totalRegistered)}`,
    },
    { label: 'Re-buy', value: formatNumber(data.rebuyCount) },
    { label: 'Total Entries', value: formatNumber(data.totalEntries) },
    { label: 'Total Stack', value: formatNumber(data.totalStack) },
    { label: 'Avg Stack', value: formatNumber(data.avgStack, { maximumFractionDigits: 0 }) },
    {
      label: 'Next Break',
      value: data.nextBreakSeconds != null ? formatDurationHMS(data.nextBreakSeconds) : '—',
    },
  ];
}

/** Payout rows, top three flagged for a medal pip; consecutive equal places are
 *  already collapsed upstream. */
function buildPayouts(results: PayoutResult[]): ProjectorPayoutRow[] {
  return groupPayoutResults(results).map((row, index) => ({
    place: formatPayoutPlace(row),
    value: [formatPayoutCash(row), row.note].filter(Boolean).join(' · '),
    medalIndex: index < MEDAL_PLACES ? index : -1,
  }));
}
