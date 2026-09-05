import type { AccountPlan } from '../entities';
import { daysUntilPlanEnd, formatPlanDate } from './planLimits';

export const ACCOUNT_LOCKED_MESSAGE =
  'This account is locked.';
export const PLAN_ENDING_NOTICE_DAYS = 7;
export const PLAN_DATA_RETENTION_DAYS = 30;

export function isAccountLocked(plan: AccountPlan | null): boolean {
  if (!plan) return false;
  return !plan.isActive;
}

export interface PlanEndingNotice {
  daysLeft: number;
  headline: string;
  /** What follows if nothing is done. */
  consequence: string;
  /** The required action. Its own field so it renders on its own line. */
  action: string;
}

/**
 * The expiry notice, or null when there is nothing to state — so a screen can
 * render the whole notice off the presence of this one value.
 *
 * Null for a plan with no end date, for one further off than
 * {@link PLAN_ENDING_NOTICE_DAYS}, and for one already expired: that account is
 * locked out and reads {@link ACCOUNT_LOCKED_MESSAGE} instead.
 */
export function planEndingNotice(
  plan: AccountPlan | null,
  todayIso: string,
): PlanEndingNotice | null {
  if (!plan || !plan.isActive || !plan.planEnd) return null;

  const daysLeft = daysUntilPlanEnd(plan, todayIso);
  if (daysLeft == null || daysLeft < 0 || daysLeft > PLAN_ENDING_NOTICE_DAYS) return null;

  return {
    daysLeft,
    headline: `Plan expires ${formatPlanDate(plan.planEnd)}`,
    consequence:
      'Sign-in will be unavailable after this date. Your data is retained for' +
      ` ${PLAN_DATA_RETENTION_DAYS} days.`,
    action: 'Contact the organiser to extend the plan.',
  };
}
