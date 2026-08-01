/**
 * The projector layout is a fixed design that scales as a whole rather than
 * reflowing, so every font size and gap is a multiple of one unit.
 *
 * One unit is 1% of the projector box's width, capped by its height at a 16:9
 * ratio — so a short/wide window scales the text down instead of overflowing
 * vertically. Container units (not `vw`/`vh`) mean the size tracks the box the
 * projector is drawn into, which is the screen on the projector page and the
 * 1920×1080 iframe during capture.
 */
export const PROJECTOR_UNIT = "min(1cqw, 1.7778cqh)";

/** CSS custom property the unit is published under, set on the ProjectorView root. */
export const PROJECTOR_UNIT_VAR = "--pu";

/** `n` projector units as a CSS length. `n` is the old `vw` multiplier: at a
 *  1920-wide box, `pu(3.5)` renders the same as the previous `3.5vw`. */
export function pu(n: number): string {
  return `calc(${n} * var(${PROJECTOR_UNIT_VAR}, 1vw))`;
}
