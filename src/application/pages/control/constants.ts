import type { ControlLevelState } from '@domain/rules/controlLabels';

/** How the level pill is tinted in each state the tournament can be in. */
export const LEVEL_PILL_CLASSES: Record<ControlLevelState, string> = {
  break: 'bg-break/10 text-break-text',
  finished: 'bg-accent/15 text-accent-lift',
  final: 'bg-accent/15 text-accent-lift',
  normal: '',
};

/** The quick nudges under the transport controls, in seconds. */
export const TIME_ADJUSTMENTS: { label: string; seconds: number }[] = [
  { label: '−1m', seconds: -60 },
  { label: '+1m', seconds: 60 },
  { label: '+5m', seconds: 300 },
];

/**
 * How close the start has to be before the screen counts down to the moment
 * registration may be opened. Beyond a day the figure is noise beside the "Next
 * session" line, which already says which evening it is.
 */
export const REGISTRATION_HINT_SECONDS = 24 * 60 * 60;
