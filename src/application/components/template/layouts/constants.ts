import type { CSSProperties } from 'react';
import type { ProjectorClockStatus, ProjectorTone } from '@domain/rules/projectorModel';
import { pu } from '@application/shared/projectorScale';

/**
 * What each of the model's three moods looks like on the projector. The domain
 * decides which mood the tournament is in; this is the only place that decides
 * what the mood is painted in, so the four layouts cannot drift apart on it.
 */
export const PROJECTOR_TONES: Record<
  ProjectorTone,
  { accent: string; clock: string; glow: string }
> = {
  normal: { accent: 'var(--pj-gold)', clock: 'var(--pj-ink)', glow: 'rgb(245 197 66 / .3)' },
  break: {
    accent: 'var(--color-break)',
    clock: 'var(--color-break)',
    glow: 'rgb(92 201 193 / .35)',
  },
  low: { accent: 'var(--color-coral)', clock: 'var(--color-coral)', glow: 'rgb(255 107 90 / .4)' },
};

/**
 * Width classes for a heading that sits in the centre column.
 *
 * Every layout's centre column is now floored at its own min-content width, so
 * the buy-in / re-buy / stack line can be set `nowrap` and the column widens to
 * hold it instead of the line breaking — the side columns give up the space,
 * since a stats rail reads fine a little narrower and that line does not read at
 * all once it has folded in half.
 *
 * The tournament name has to be kept out of that measurement: it is a name of
 * any length and it is meant to truncate, so left alone it would drive the
 * column wider than the layout ever intended. `w-0` makes its contribution to
 * the column's min-content zero — a definite width contributes itself — and
 * `min-w-full` gives it the whole column back once that width is settled, so it
 * still fills and truncates exactly as before without having voted on the size.
 */
export const CENTRE_HEADING_WIDTH = 'w-0 min-w-full';

/** Radius of the soft light behind the countdown, in projector units. */
const CLOCK_GLOW_RADIUS = 5;

/**
 * How much smaller "PAUSED" is set than the countdown it stands in for — a word
 * where the clock is digits, so it runs wider at the same size.
 *
 * One trim shared by every layout rather than a second size constant in each:
 * the layouts already disagree about how big their clock is, and they should not
 * also be free to disagree about how much a pause takes off it.
 */
const PAUSED_CLOCK_TRIM = 0.2;

/**
 * The clock's font size in projector units for the state it is in. Each layout
 * passes its own two sizes; the pause trim is applied here so it stays uniform.
 */
export function clockFontSize(
  status: ProjectorClockStatus,
  sizes: { running: number; finished: number },
): number {
  if (status === 'finished') return sizes.finished;
  return status === 'paused' ? sizes.running - PAUSED_CLOCK_TRIM : sizes.running;
}

/** Gradients for the first three places on a payout list. */
export const MEDALS = [
  'linear-gradient(160deg,#FFE59A,#E0A800)',
  'linear-gradient(160deg,#E8E4D8,#A8A292)',
  'linear-gradient(160deg,#E0A26A,#9A6634)',
];

/** Ink for a medal pip's place number — dark enough to read on any of the three. */
const MEDAL_INK = '#1B1503';

export const PLACE_INK = 'var(--color-fg-strong)';

/** Size of a payout list's place pip, in projector units. */
const PIP_HEIGHT = 2.9;
const PIP_TEXT = 1.5;

export function clockShadow(tone: ProjectorTone): string {
  return `0 0 ${pu(CLOCK_GLOW_RADIUS)} ${PROJECTOR_TONES[tone].glow}`;
}

/**
 * The level heading's colour. Unlike the rest it has a fourth case: a finished
 * tournament goes gold rather than staying dim, so the last thing on screen
 * still reads as a result instead of an idle clock.
 */
export function levelColor(tone: ProjectorTone, isFinished: boolean): string {
  if (tone === 'break') return 'var(--color-break)';
  return isFinished ? 'var(--pj-gold)' : 'var(--pj-dim)';
}

export function payoutPip(medalIndex: number): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 'none',
    minWidth: pu(PIP_HEIGHT),
    height: pu(PIP_HEIGHT),
    padding: `0 ${pu(0.8)}`,
    borderRadius: '999px',
    whiteSpace: 'nowrap',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: pu(PIP_TEXT),
    ...(medalIndex >= 0
      ? { background: MEDALS[medalIndex], color: MEDAL_INK }
      : { background: 'var(--pj-panel-2)', color: PLACE_INK }),
  };
}
