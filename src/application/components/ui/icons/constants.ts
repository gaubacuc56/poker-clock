/** Default drawn size, so an icon dropped in without a class still matches the set. */
export const ICON_SIZE = 'size-[18px]';

/** The 24-unit grid every glyph in the set is drawn on. */
const VIEW_BOX = '0 0 24 24';

/** Shared attributes for the outline icons — one stroke weight across the set. */
export function outline(className = ICON_SIZE) {
  return {
    className,
    viewBox: VIEW_BOX,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
}

/** Shared attributes for the filled icons — the same grid, painted rather than stroked. */
export function solid(className = ICON_SIZE) {
  return {
    className,
    viewBox: VIEW_BOX,
    fill: 'currentColor',
    'aria-hidden': true,
  };
}
