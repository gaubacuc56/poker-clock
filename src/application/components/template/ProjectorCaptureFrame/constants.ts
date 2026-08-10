// The projector image is always rendered at a fixed 16:9 HD frame, independent
// of the device that triggers the capture.
export const FRAME_WIDTH = 1920;
export const FRAME_HEIGHT = 1080;

/** Marks the stylesheet copy this component injects, so a second capture
 *  replaces it rather than stacking another one on top. */
export const CAPTURE_STYLE_ATTRIBUTE = 'data-capture-styles';

/**
 * A capture is a still, so nothing in the frame may be mid-animation when it is
 * taken. The clock re-keys itself on every state change — pausing swaps the
 * countdown for "PAUSED" and remounts it — which starts the `lvlin` fade-in
 * (opacity 0 → 1) a moment before the admin hits capture, and the image then
 * catches the word at almost zero opacity, washed out to a ghost of its colour.
 * Freezing every animation and transition makes the frame show the state the
 * projector settles on rather than a frame of the way it got there.
 */
export const FREEZE_MOTION_CSS = `*,*::before,*::after{animation:none !important;transition:none !important;}`;
