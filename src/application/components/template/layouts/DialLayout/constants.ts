/** Circumference of the r=140 track, to the precision the dash maths needs. */
export const TRACK_LENGTH = 879.65;

/**
 * Side of the ring's box, in projector units. Down from the original 36 to pay
 * for ledger's type around it, and as large as the centre column will carry —
 * the name, price line, blinds and next-up line below it are all sized to
 * ledger now, and what is left over is this.
 */
export const DIAL_SIZE = 33;

/** The clear space inside the 10-wide track, as a fraction of the box. */
export const DIAL_INNER = 0.84;

/** Largest the countdown is ever set, however much room the ring has. */
export const CLOCK_MAX = 10;

/** "FINISHED" is a longer word than any countdown, so it gets its own size. */
export const FINISHED_CLOCK_SIZE = 5.9;

/**
 * Advance widths of the display face, as a fraction of its font size. The
 * digits are tabular so they all share one; the colon is much narrower.
 */
export const DIGIT_WIDTH = 0.54;
export const COLON_WIDTH = 0.3;

/** The level heading inside the ring, and the chip-race line under it. */
export const LEVEL_LABEL_SIZE = 2.4;
export const CHIP_RACE_SIZE = 1.4;

/** The prize column, which dial keeps smaller than ledger's. */
export const PRIZE_LABEL_SIZE = 1.4;
export const PRIZE_VALUE_SIZE = 3.6;
export const PAYOUT_ROW_SIZE = 1.9;
