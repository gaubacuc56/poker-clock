/** Never shrink past this — smaller than a third of the design size the rows
 *  stop reading from the room, so the tail is clipped instead. */
export const MIN_SCALE = 0.3;

/** Ignore adjustments below this: the fit is close enough, and stopping here is
 *  what keeps a settled layout from being written to again. */
export const SETTLED = 0.005;

/**
 * Corrections after the first estimate. One is normally enough: the estimate is
 * exact for everything that scales with `--pu`, and only has to be walked in for
 * the parts that don't — hairline borders are a fixed 1px however small the rows
 * get, so a list of them lands slightly over the line.
 */
export const REFINEMENTS = 3;
