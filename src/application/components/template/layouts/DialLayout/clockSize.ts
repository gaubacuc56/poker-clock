import { CLOCK_MAX, COLON_WIDTH, DIAL_INNER, DIAL_SIZE, DIGIT_WIDTH } from './constants';

/**
 * The countdown, sized to fit across the ring rather than to a fixed number.
 *
 * A level under an hour reads `12:34` and takes the cap, but the clock also
 * shows totals — `120:00` is a glyph wider, and a fixed size that suits the
 * first runs straight through the track on the second.
 */
export function clockSize(text: string): number {
  const width = [...text].reduce(
    (sum, char) => sum + (char === ':' ? COLON_WIDTH : DIGIT_WIDTH),
    0,
  );
  return Math.min(CLOCK_MAX, (DIAL_SIZE * DIAL_INNER) / Math.max(1, width));
}
