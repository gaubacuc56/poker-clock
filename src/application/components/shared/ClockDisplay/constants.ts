/** The level/break heading above the clock and the blinds/ante lines below it
 *  are the same size, so the clock sits between two matching bands of text. */
export const LEVEL_TEXT_SIZE = 4.2;

/** The next-level line under the blinds. */
export const NEXT_TEXT_SIZE = 3.4;

/** The chip-race line, and the blinds/ante rows' gap. */
export const CHIP_RACE_SIZE = 2.8;

/** "FINISHED" is a longer word than the countdown, so it gets a smaller size
 *  to keep it from overflowing the clock column. */
export const CLOCK_SIZE = 14;
export const FINISHED_CLOCK_SIZE = 10;

/** The countdown is set loose rather than tight: at this size the digits ran
 *  into each other, and the colon had nothing to sit in. */
export const DIGIT_TRACKING = '0.04em';

/**
 * Per-state colouring for the classic screen, mirroring the control screen's
 * dial so both surfaces read the same at a glance: gold running, teal on a
 * break, coral running out.
 *
 * Keyed by `ProjectorTone`, so the domain decides which state applies and this
 * only decides what it looks like.
 */
export const CLASSIC_TONES = {
  normal: {
    heading: 'text-accent',
    digits: 'text-fg [text-shadow:0_0_0.08em_rgba(245,197,66,.35)]',
  },
  break: {
    heading: 'text-break',
    digits: 'text-break [text-shadow:0_0_0.08em_rgba(92,201,193,.4)]',
  },
  low: {
    heading: 'text-coral',
    digits: 'text-coral [text-shadow:0_0_0.08em_rgba(255,107,90,.45)]',
  },
} as const;
