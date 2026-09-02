import type { AccountPlan, PlanUsage } from '../entities';

/**
 * Reading a plan: what is left, whether something is allowed, and how to say so.
 *
 * The database enforces every one of these limits itself — see the triggers and
 * the storage policy in `0013`. What is here is the polite half: refusing before
 * the round trip, with a sentence that names the plan and the number, rather
 * than letting a constraint error reach the operator.
 */

/** The plan an account falls back to when it has none, or when its own has lapsed. */
export const FALLBACK_PLAN_CODE = 'BASIC';

/** The three things a plan puts a number on. */
export type PlanLimitKind = 'tournaments' | 'runningTournaments' | 'backgrounds';

const LIMIT_NOUNS: Record<PlanLimitKind, { one: string; many: string }> = {
  tournaments: { one: 'tournament', many: 'tournaments' },
  runningTournaments: { one: 'running tournament', many: 'running tournaments' },
  backgrounds: { one: 'background', many: 'backgrounds' },
};

/** The plan's number for one kind, or null when that kind isn't capped. */
export function planLimit(plan: AccountPlan | null, kind: PlanLimitKind): number | null {
  if (!plan) return null;
  switch (kind) {
    case 'tournaments':
      return plan.maxTour;
    case 'runningTournaments':
      return plan.maxRunningTour;
    case 'backgrounds':
      return plan.maxBackground;
  }
}

/**
 * The name to show for the plan in force.
 *
 * A lapsed plan is not the plan the account is on today, so the fallback is
 * named instead — the screen would otherwise print an allowance of 100 beside
 * the word MODERATOR while the account was actually being held to 10.
 */
export function effectivePlanCode(plan: AccountPlan | null): string {
  if (!plan) return FALLBACK_PLAN_CODE;
  return plan.isActive && plan.planCode ? plan.planCode : FALLBACK_PLAN_CODE;
}

/**
 * Whether one more of `kind` is allowed. An unknown plan (still loading, or a
 * failed fetch) allows it: the database is the thing that actually says no, and
 * a screen that blocks on a missing answer is worse than one that tries.
 */
export function isWithinPlanLimit(
  plan: AccountPlan | null,
  kind: PlanLimitKind,
  used: number,
): boolean {
  const limit = planLimit(plan, kind);
  return limit == null || used < limit;
}

/**
 * Why the next one is refused, or null when it isn't — shaped to be dropped
 * straight into a toast or an inline error.
 */
export function planLimitMessage(
  plan: AccountPlan | null,
  kind: PlanLimitKind,
  used: number,
): string | null {
  if (isWithinPlanLimit(plan, kind, used)) return null;
  const limit = planLimit(plan, kind)!;
  const noun = limit === 1 ? LIMIT_NOUNS[kind].one : LIMIT_NOUNS[kind].many;
  return `Maximum ${limit} ${noun} reached.`;
}

/** "3 of 10", or "3 of ∞" for an uncapped allowance. */
export function formatPlanAllowance(limit: number | null, used: number): string {
  return `${used} of ${limit ?? '∞'}`;
}

/** 0…1 of an allowance already used; 0 when it isn't capped, so no bar fills. */
export function planUsageFraction(limit: number | null, used: number): number {
  if (limit == null || limit <= 0) return 0;
  return Math.min(1, used / limit);
}

/**
 * The plan's validity as a sentence — the same three cases the nullable dates
 * encode, said out loud rather than left as two blank fields.
 */
export function formatPlanPeriod(plan: AccountPlan | null): string {
  if (!plan || (!plan.planStart && !plan.planEnd)) return 'No end date';
  if (plan.planStart && plan.planEnd) {
    return `${formatPlanDate(plan.planStart)} – ${formatPlanDate(plan.planEnd)}`;
  }
  if (plan.planEnd) return `Until ${formatPlanDate(plan.planEnd)}`;
  return `From ${formatPlanDate(plan.planStart!)}`;
}

/**
 * A `yyyy-mm-dd` as `dd/mm/yyyy` — the app's one date format, assembled rather
 * than handed to a locale formatter for the same reason schedules are.
 */
export function formatPlanDate(date: string): string {
  const [year, month, day] = date.slice(0, 10).split('-');
  return day && month && year ? `${day}/${month}/${year}` : date;
}

/**
 * Days until the plan lapses — negative once it has, null when it never will.
 * Whole days counted off the date alone, since that is all a `date` column says.
 */
export function daysUntilPlanEnd(plan: AccountPlan | null, todayIso: string): number | null {
  if (!plan?.planEnd) return null;
  const end = Date.parse(`${plan.planEnd.slice(0, 10)}T00:00:00Z`);
  const today = Date.parse(`${todayIso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(end) || Number.isNaN(today)) return null;
  return Math.round((end - today) / 86_400_000);
}

/** The usage a plan screen shows, counted from what the app already has loaded. */
export function countPlanUsage(
  statuses: readonly string[],
  backgroundCount: number,
): PlanUsage {
  return {
    tournaments: statuses.length,
    runningTournaments: statuses.filter((s) => s === 'running' || s === 'paused').length,
    backgrounds: backgroundCount,
  };
}
