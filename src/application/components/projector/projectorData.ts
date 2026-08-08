import type { CSSProperties } from 'react';
import type { BlindLevel, PayoutResult } from '@domain/entities';
import { formatChipRaceLabel, formatLevelLabel } from '@domain/rules/blindFormat';
import {
  formatAmount,
  formatCompactNumber,
  formatClock,
  formatDurationHMS,
  formatNumber,
} from '@domain/rules/format';
import {
  formatPayoutCash,
  formatPayoutPlace,
  groupPayoutResults,
} from '@domain/rules/payouts';
import { pu } from '../../shared/projectorScale';
import type { ProjectorViewProps } from './ProjectorView';

/** Under a minute left on a play level — the clock, rail and dial all go coral. */
export const LOW_TIME_SECONDS = 60;

/**
 * Everything the layouts need that isn't already a prop, derived once so all
 * five arrangements label, colour and format the same numbers identically.
 * Colours are `--pj-*` tokens, never raw hex.
 */
export interface ProjectorModel {
  isBreak: boolean;
  isLowTime: boolean;
  /** 0…1 of the current level already elapsed — drives the rail and the dial. */
  elapsedFraction: number;
  levelLabel: string;
  levelColor: string;
  chipRaceLine: string;
  clockText: string;
  clockColor: string;
  clockShadow: string;
  /** Changes on every level change, so a layout can re-key its clock to replay the animation. */
  levelKey: string;
  accentColor: string;
  showBlinds: boolean;
  blinds: { sb: string; bb: string; anteNumber: string; anteUnit: string; ante: string };
  blindsText: string;
  priceLine: string;
  nextText: string;
  stats: { label: string; value: string }[];
  payouts: { place: string; value: string; isMedal: boolean; pip: CSSProperties }[];
}

const MEDALS = [
  'linear-gradient(160deg,#FFE59A,#E0A800)',
  'linear-gradient(160deg,#E8E4D8,#A8A292)',
  'linear-gradient(160deg,#E0A26A,#9A6634)',
];

function anteParts(level: BlindLevel): { anteNumber: string; anteUnit: string } {
  if (level.isBigBlindAnte) return { anteNumber: formatCompactNumber(level.bigBlind), anteUnit: 'BBA' };
  return { anteNumber: level.ante > 0 ? formatCompactNumber(level.ante) : '—', anteUnit: '' };
}

export function buildProjectorModel(props: ProjectorViewProps): ProjectorModel {
  const {
    currentLevel,
    nextLevel,
    secondsRemaining,
    isPaused,
    isFinished = false,
    entryPriceLines,
    startingStack,
  } = props;

  const isBreak = currentLevel.isBreak;
  const isLowTime =
    !isBreak && !isFinished && secondsRemaining > 0 && secondsRemaining <= LOW_TIME_SECONDS;

  const duration = Math.max(1, currentLevel.durationSeconds);
  const elapsedFraction = isFinished
    ? 1
    : Math.min(1, Math.max(0, 1 - secondsRemaining / duration));

  const accentColor = isLowTime
    ? 'var(--color-coral)'
    : isBreak
      ? 'var(--color-break)'
      : 'var(--pj-gold)';

  const { anteNumber, anteUnit } = anteParts(currentLevel);

  const nextText = !nextLevel
    ? 'Last level'
    : nextLevel.isBreak
      ? `Next: ${formatLevelLabel(nextLevel)}`
      : `Next: ${formatCompactNumber(nextLevel.smallBlind)} / ${formatCompactNumber(nextLevel.bigBlind)}`;

  return {
    isBreak,
    isLowTime,
    elapsedFraction,
    levelLabel: isFinished ? 'Finished' : formatLevelLabel(currentLevel),
    levelColor: isBreak
      ? 'var(--color-break)'
      : isFinished
        ? 'var(--pj-gold)'
        : 'var(--pj-dim)',
    chipRaceLine: isBreak && currentLevel.chipRace ? formatChipRaceLabel(currentLevel) : '',
    clockText: isFinished ? 'FINISHED' : isPaused ? 'PAUSED' : formatClock(secondsRemaining),
    clockColor: isLowTime
      ? 'var(--color-coral)'
      : isBreak
        ? 'var(--color-break)'
        : 'var(--pj-ink)',
    clockShadow: isLowTime
      ? `0 0 ${pu(5)} rgb(255 107 90 / .4)`
      : isBreak
        ? `0 0 ${pu(5)} rgb(92 201 193 / .35)`
        : `0 0 ${pu(5)} rgb(245 197 66 / .3)`,
    levelKey: `${currentLevel.level}${currentLevel.isBreak ? 'b' : ''}${isFinished ? 'f' : ''}${
      isPaused ? 'p' : ''
    }`,
    accentColor,
    showBlinds: !isBreak,
    blinds: {
      sb: formatCompactNumber(currentLevel.smallBlind),
      bb: formatCompactNumber(currentLevel.bigBlind),
      anteNumber,
      anteUnit,
      ante: anteUnit ? `${anteNumber} ${anteUnit}` : anteNumber,
    },
    blindsText: `${formatCompactNumber(currentLevel.smallBlind)} / ${formatCompactNumber(
      currentLevel.bigBlind,
    )}`,
    priceLine: [
      ...entryPriceLines.map((line) => `${line.label} ${formatAmount(line.amountCents)}`),
      `Stack ${formatNumber(startingStack)}`,
    ].join('   ·   '),
    nextText,
    stats: buildStats(props),
    payouts: buildPayouts(props.payoutResults),
  };
}

/** The same six figures the classic layout shows, in the same order. */
function buildStats(props: ProjectorViewProps): { label: string; value: string }[] {
  return [
    {
      label: 'Players',
      value: `${formatNumber(props.remainingPlayers)} / ${formatNumber(props.totalRegistered)}`,
    },
    { label: 'Re-buy', value: formatNumber(props.rebuyCount) },
    { label: 'Total Entries', value: formatNumber(props.totalEntries) },
    { label: 'Total Stack', value: formatNumber(props.totalStack) },
    { label: 'Avg Stack', value: formatNumber(props.avgStack, { maximumFractionDigits: 0 }) },
    {
      label: 'Next Break',
      value: props.nextBreakSeconds != null ? formatDurationHMS(props.nextBreakSeconds) : '—',
    },
  ];
}

/** Payout rows with the medal pip for the top three; consecutive equal places are already collapsed upstream. */
function buildPayouts(results: PayoutResult[]) {
  return groupPayoutResults(results).map((row, index) => {
    const cash = formatPayoutCash(row);
    return {
      place: formatPayoutPlace(row),
      value: [cash, row.note].filter(Boolean).join(' · '),
      isMedal: index < 3,
      pip: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
        minWidth: pu(2.9),
        height: pu(2.9),
        padding: `0 ${pu(0.8)}`,
        borderRadius: '999px',
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: pu(1.5),
        ...(index < 3
          ? { background: MEDALS[index], color: '#1B1503' }
          : { background: 'var(--pj-panel-2)', color: 'var(--pj-dim)' }),
      } satisfies CSSProperties,
    };
  });
}
