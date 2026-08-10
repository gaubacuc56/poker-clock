import type { BlindLevel, PayoutResult, ProjectorData } from '../entities';
import { LOW_TIME_SECONDS, MEDAL_PLACES, PRICE_LINE_SEPARATOR } from '../constants/projector';
import {
  formatBlinds,
  formatBlindsLine,
  formatChipRaceLabel,
  formatLevelLabel,
} from './blindFormat';
import {
  formatAmount,
  formatClock,
  formatCompactNumber,
  formatDurationHMS,
  formatNumber,
} from './format';
import { formatPayoutCash, formatPayoutPlace, groupPayoutResults } from './payouts';

/**
 * What the countdown is doing, as one value rather than a set of flags.
 *
 * Layouts ask for `running` positively and never for the absence of a
 * particular halt. A status added to this union later — a chip race, a
 * scheduled stop, a lost sync — then reads as "not counting" everywhere it
 * hasn't been thought about yet, instead of slipping through a `!isPaused`
 * test as though the clock were still ticking.
 */
export type ProjectorClockStatus = 'running' | 'paused' | 'finished';

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
    entryPriceLines,
    startingStack,
  } = data;

  const clockStatus: ProjectorClockStatus = isFinished
    ? 'finished'
    : isPaused
      ? 'paused'
      : 'running';

  const isBreak = currentLevel.isBreak;
  const isLowTime =
    !isBreak && !isFinished && secondsRemaining > 0 && secondsRemaining <= LOW_TIME_SECONDS;

  const duration = Math.max(1, currentLevel.durationSeconds);
  const elapsedFraction = isFinished
    ? 1
    : Math.min(1, Math.max(0, 1 - secondsRemaining / duration));

  const { anteNumber, anteUnit } = anteParts(currentLevel);

  return {
    isBreak,
    isLowTime,
    isFinished,
    tone: isLowTime ? 'low' : isBreak ? 'break' : 'normal',
    clockStatus,
    isRunning: clockStatus === 'running',
    elapsedFraction,
    levelLabel: isFinished ? 'Finished' : formatLevelLabel(currentLevel),
    chipRaceLine: isBreak && currentLevel.chipRace ? formatChipRaceLabel(currentLevel) : '',
    clockText: isFinished ? 'FINISHED' : isPaused ? 'PAUSED' : formatClock(secondsRemaining),
    levelKey: `${currentLevel.level}${currentLevel.isBreak ? 'b' : ''}${isFinished ? 'f' : ''}${
      isPaused ? 'p' : ''
    }`,
    showBlinds: !isBreak,
    blinds: {
      sb: formatCompactNumber(currentLevel.smallBlind),
      bb: formatCompactNumber(currentLevel.bigBlind),
      anteNumber,
      anteUnit,
      ante: anteUnit ? `${anteNumber} ${anteUnit}` : anteNumber,
    },
    blindsText: formatBlinds(currentLevel),
    priceLine: buildPriceLine(entryPriceLines, startingStack),
    nextText: buildNextText(nextLevel),
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
    ...entryPriceLines.map((line) => `${line.label} ${formatAmount(line.amountCents)}`),
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
