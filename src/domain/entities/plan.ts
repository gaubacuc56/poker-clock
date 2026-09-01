/**
 * What an account is allowed to do, and until when.
 *
 * Plans are named sets of allowances (`BASIC`, `MODERATOR`, …) held in the
 * database rather than in code, so a new tier is a row rather than a release.
 * A null allowance means no limit, which is a different thing from zero — that
 * distinction is why every one of them is nullable.
 */
export interface PlanLimits {
  maxTour: number | null;
  maxRunningTour: number | null;
  maxBackground: number | null;
}

/** The plan in force for the signed-in account, as the settings screen reads it. */
export interface AccountPlan extends PlanLimits {
  /** The plan named on the account, or null when it has never been given one. */
  planCode: string | null;
  /** `yyyy-mm-dd`, or null for "always been in force". */
  planStart: string | null;
  /** `yyyy-mm-dd`, or null for "does not expire". */
  planEnd: string | null;
  /**
   * Whether the named plan actually applies today. When it doesn't — not started
   * yet, or already ended — the allowances above are BASIC's: an expired
   * subscription drops to the free tier rather than locking the organiser out of
   * tournaments they already have.
   */
  isActive: boolean;
}

/** What the account has actually used, counted against {@link PlanLimits}. */
export interface PlanUsage {
  tournaments: number;
  runningTournaments: number;
  backgrounds: number;
}
