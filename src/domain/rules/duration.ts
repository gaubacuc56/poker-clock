/** Whole minutes from a second count — for showing/editing level lengths as minutes. */
export function secondsToMinutes(seconds: number): number {
  return Math.round(seconds / 60);
}

/** Seconds from a minute count — inverse of `secondsToMinutes`, for storing edited lengths. */
export function minutesToSeconds(minutes: number): number {
  return minutes * 60;
}
