import type { CSSProperties } from 'react';
import type { ProjectorTone } from '@domain/rules/projectorModel';
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

/** Radius of the soft light behind the countdown, in projector units. */
const CLOCK_GLOW_RADIUS = 5;

/** Gradients for the first three places on a payout list. */
export const MEDALS = [
  'linear-gradient(160deg,#FFE59A,#E0A800)',
  'linear-gradient(160deg,#E8E4D8,#A8A292)',
  'linear-gradient(160deg,#E0A26A,#9A6634)',
];

/** Ink for a medal pip's place number — dark enough to read on any of the three. */
const MEDAL_INK = '#1B1503';

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

/** The rounded place marker beside a payout — a medal for the top three, a
 *  quiet panel chip for everyone else. */
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
      : { background: 'var(--pj-panel-2)', color: 'var(--pj-dim)' }),
  };
}
