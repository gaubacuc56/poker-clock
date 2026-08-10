// Centre-heading type scale, in projector units. Line heights are pinned so the
// heading's total height is known without measuring it, and the left column can
// reserve exactly that much space for the logo.
export const TITLE_SIZE = 4;
export const SUBTITLE_SIZE = 2.8;
export const HEADING_LINE_HEIGHT = 1.2;
export const HEADING_HEIGHT = (TITLE_SIZE + SUBTITLE_SIZE) * HEADING_LINE_HEIGHT;

/** Left column width, in projector units — sized so "TOTAL ENTRIES", the
 *  longest stat label, fits on one line. */
export const STATS_COLUMN_WIDTH = 20;

/** Payout column bounds, in projector units. The maximum leaves the clock
 *  column enough room for its widest blinds line. */
export const PAYOUT_MIN_WIDTH = 16;
export const PAYOUT_MAX_WIDTH = 16;

/** The prize-pool heading and figure above the payout list. */
export const PRIZE_LABEL_SIZE = 1.8;
export const PRIZE_VALUE_SIZE = 3;
