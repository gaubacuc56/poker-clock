/** The wizard's steps, in order. The index is the step — `STEPS[step]` is its name. */
export const STEPS = ['Basics', 'Blinds', 'Payouts', 'Projector', 'Sounds', 'Review'] as const;

/** Position of each step, so a jump reads as a name rather than a number. */
export const STEP_INDEX = {
  basics: 0,
  blinds: 1,
  payouts: 2,
  projector: 3,
  sounds: 4,
  review: 5,
} as const;

export const LAST_STEP = STEPS.length - 1;
