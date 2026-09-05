import { describe, expect, it } from 'vitest';
import {
  isAccountLocked,
  planEndingNotice,
  PLAN_ENDING_NOTICE_DAYS,
} from './accountAccess';
import type { AccountPlan } from '../entities';

function makePlan(overrides: Partial<AccountPlan> = {}): AccountPlan {
  return {
    planCode: 'BASIC',
    planStart: '2026-01-01',
    planEnd: null,
    isActive: true,
    maxTour: 10,
    maxRunningTour: 1,
    maxBackground: 10,
    ...overrides,
  };
}

const TODAY = '2026-08-10T09:00:00.000Z';
/** Days from TODAY as the `yyyy-mm-dd` a plan stores. */
const inDays = (days: number) =>
  new Date(Date.parse('2026-08-10T00:00:00Z') + days * 86_400_000)
    .toISOString()
    .slice(0, 10);

describe('isAccountLocked', () => {
  it('lets an account with a plan in force in', () => {
    expect(isAccountLocked(makePlan())).toBe(false);
  });

  it('closes the app to an account whose plan is not in force', () => {
    expect(isAccountLocked(makePlan({ isActive: false }))).toBe(true);
    // Whatever put it out of force — ended, not started, or no plan named at
    // all — is one answer with one message.
    expect(isAccountLocked(makePlan({ isActive: false, planCode: null }))).toBe(true);
  });

  it('never locks on an answer it does not have', () => {
    expect(isAccountLocked(null)).toBe(false);
  });
});

describe('planEndingNotice', () => {
  it('says nothing for a plan that does not expire', () => {
    expect(planEndingNotice(makePlan({ planEnd: null }), TODAY)).toBeNull();
  });

  it('says nothing while the end is further off than the notice period', () => {
    expect(
      planEndingNotice(makePlan({ planEnd: inDays(PLAN_ENDING_NOTICE_DAYS + 1) }), TODAY),
    ).toBeNull();
  });

  it('starts exactly a week out', () => {
    const notice = planEndingNotice(
      makePlan({ planEnd: inDays(PLAN_ENDING_NOTICE_DAYS) }),
      TODAY,
    );
    expect(notice?.daysLeft).toBe(PLAN_ENDING_NOTICE_DAYS);
    expect(notice?.headline).toBe('Plan expires 17/08/2026');
  });

  it('states the date rather than a countdown, to the last day', () => {
    expect(planEndingNotice(makePlan({ planEnd: inDays(1) }), TODAY)?.headline).toBe(
      'Plan expires 11/08/2026',
    );
    expect(planEndingNotice(makePlan({ planEnd: inDays(0) }), TODAY)?.headline).toBe(
      'Plan expires 10/08/2026',
    );
  });

  it('keeps the required action on a line of its own', () => {
    const notice = planEndingNotice(makePlan({ planEnd: inDays(2) }), TODAY)!;
    expect(notice.consequence).toContain('Sign-in will be unavailable');
    expect(notice.consequence).toContain('retained for 30 days');
    expect(notice.action).toBe('Contact the organiser to extend the plan.');
  });

  it('stops warning once the plan has gone — that account is locked out instead', () => {
    expect(planEndingNotice(makePlan({ planEnd: inDays(-1) }), TODAY)).toBeNull();
    expect(
      planEndingNotice(makePlan({ planEnd: inDays(-1), isActive: false }), TODAY),
    ).toBeNull();
    expect(planEndingNotice(null, TODAY)).toBeNull();
  });
});
