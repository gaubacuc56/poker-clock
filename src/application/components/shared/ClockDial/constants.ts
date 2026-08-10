/** Circumference of the r=140 track, to the precision the dash maths needs. */
export const TRACK_LENGTH = 879.65;

/** Digit size (px) for the usual "MM:SS" countdown, and the length it is sized for. */
export const DIGIT_SIZE = 59;
export const BASE_CLOCK_LENGTH = 5;

/** "FINISHED" is a longer word than any countdown, so it gets its own size. */
export const FINISHED_SIZE = 33;

/** Per-state colouring for the ring, its glow and the digits. */
export const DIAL_TONES = {
  normal: {
    stroke: 'stroke-accent',
    ringGlow: 'drop-shadow-[0_0_14px_rgba(245,197,66,.45)]',
    halo: 'bg-[radial-gradient(circle,rgba(245,197,66,.24)_0%,transparent_66%)]',
    digits: 'text-fg [text-shadow:0_0_38px_rgba(245,197,66,.22)]',
    colon: 'text-accent',
  },
  finished: {
    stroke: 'stroke-accent',
    ringGlow: 'drop-shadow-[0_0_14px_rgba(245,197,66,.45)]',
    halo: 'bg-[radial-gradient(circle,rgba(245,197,66,.34)_0%,transparent_66%)]',
    digits: 'text-fg [text-shadow:0_0_38px_rgba(245,197,66,.22)]',
    colon: 'text-accent',
  },
  break: {
    stroke: 'stroke-break',
    ringGlow: 'drop-shadow-[0_0_14px_rgba(92,201,193,.5)]',
    halo: 'bg-[radial-gradient(circle,rgba(92,201,193,.26)_0%,transparent_66%)]',
    digits: 'text-break [text-shadow:0_0_34px_rgba(92,201,193,.3)]',
    colon: 'text-break',
  },
  low: {
    stroke: 'stroke-coral',
    ringGlow: 'drop-shadow-[0_0_14px_rgba(255,107,90,.55)]',
    halo: 'bg-[radial-gradient(circle,rgba(255,107,90,.30)_0%,transparent_66%)] animate-[breathe_1s_ease-in-out_infinite]',
    digits: 'text-coral [text-shadow:0_0_34px_rgba(255,107,90,.38)]',
    colon: 'text-coral',
  },
} as const;

export type DialTone = keyof typeof DIAL_TONES;
