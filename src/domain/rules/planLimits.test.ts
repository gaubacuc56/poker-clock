import { describe, expect, it } from 'vitest';
import {
  countPlanUsage,
  daysUntilPlanEnd,
  effectivePlanCode,
  formatPlanAllowance,
  formatPlanPeriod,
  isWithinPlanLimit,
  planLimit,
  planLimitMessage,
  planUsageFraction,
} from './planLimits';
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

describe('planLimit', () => {
  it('reads each allowance by name', () => {
    const plan = makePlan();
    expect(planLimit(plan, 'tournaments')).toBe(10);
    expect(planLimit(plan, 'runningTournaments')).toBe(1);
    expect(planLimit(plan, 'backgrounds')).toBe(10);
  });

  it('is uncapped when there is no plan to read', () => {
    expect(planLimit(null, 'tournaments')).toBeNull();
  });
});

describe('effectivePlanCode', () => {
  it('names the plan while it is in force', () => {
    expect(effectivePlanCode(makePlan({ planCode: 'MODERATOR' }))).toBe('MODERATOR');
  });

  it('names the fallback once it has lapsed, since that is what applies', () => {
    expect(effectivePlanCode(makePlan({ planCode: 'MODERATOR', isActive: false }))).toBe('BASIC');
  });

  it('names the fallback for an account that was never given a plan', () => {
    expect(effectivePlanCode(makePlan({ planCode: null, isActive: false }))).toBe('BASIC');
    expect(effectivePlanCode(null)).toBe('BASIC');
  });
});

describe('isWithinPlanLimit', () => {
  it('allows up to the limit and refuses at it', () => {
    const plan = makePlan({ maxTour: 2 });
    expect(isWithinPlanLimit(plan, 'tournaments', 1)).toBe(true);
    expect(isWithinPlanLimit(plan, 'tournaments', 2)).toBe(false);
    expect(isWithinPlanLimit(plan, 'tournaments', 3)).toBe(false);
  });

  it('allows anything on an uncapped allowance', () => {
    expect(isWithinPlanLimit(makePlan({ maxTour: null }), 'tournaments', 9999)).toBe(true);
  });

  it('allows it when the plan is unknown — the database is what says no', () => {
    expect(isWithinPlanLimit(null, 'tournaments', 9999)).toBe(true);
  });

  it('treats a zero allowance as none at all, not as unlimited', () => {
    expect(isWithinPlanLimit(makePlan({ maxTour: 0 }), 'tournaments', 0)).toBe(false);
  });
});

describe('planLimitMessage', () => {
  it('says nothing while there is room', () => {
    expect(planLimitMessage(makePlan(), 'tournaments', 3)).toBeNull();
  });

  it('names the number that has been reached', () => {
    expect(planLimitMessage(makePlan({ maxTour: 10 }), 'tournaments', 10)).toBe(
      'Maximum 10 tournaments reached.',
    );
  });

  it('reads as one thing when the allowance is one', () => {
    expect(planLimitMessage(makePlan({ maxRunningTour: 1 }), 'runningTournaments', 1)).toBe(
      'Maximum 1 running tournament reached.',
    );
    expect(planLimitMessage(makePlan({ maxRunningTour: 3 }), 'runningTournaments', 3)).toBe(
      'Maximum 3 running tournaments reached.',
    );
  });

  it('quotes the allowance, not which plan it came from', () => {
    // A lapsed plan is held to BASIC's numbers, but the operator is told the
    // number they have hit rather than the name of the plan behind it.
    const lapsed = makePlan({ planCode: 'MODERATOR', isActive: false, maxTour: 10 });
    expect(planLimitMessage(lapsed, 'tournaments', 10)).toBe('Maximum 10 tournaments reached.');
  });
});

describe('formatPlanAllowance', () => {
  it('reads as used of allowed', () => {
    expect(formatPlanAllowance(10, 3)).toBe('3 of 10');
  });

  it('says so when there is no cap', () => {
    expect(formatPlanAllowance(null, 3)).toBe('3 of ∞');
  });
});

describe('planUsageFraction', () => {
  it('is the share of the allowance used, capped at full', () => {
    expect(planUsageFraction(10, 0)).toBe(0);
    expect(planUsageFraction(10, 5)).toBe(0.5);
    expect(planUsageFraction(10, 12)).toBe(1);
  });

  it('is empty for an uncapped allowance — there is no bar to fill', () => {
    expect(planUsageFraction(null, 40)).toBe(0);
  });
});

describe('formatPlanPeriod', () => {
  it('spells out both bounds when both are set', () => {
    expect(formatPlanPeriod(makePlan({ planStart: '2026-01-01', planEnd: '2026-12-31' }))).toBe(
      '01/01/2026 – 31/12/2026',
    );
  });

  it('distinguishes the three ways a bound can be absent', () => {
    expect(formatPlanPeriod(makePlan({ planStart: '2026-01-01', planEnd: null }))).toBe(
      'From 01/01/2026',
    );
    expect(formatPlanPeriod(makePlan({ planStart: null, planEnd: '2026-12-31' }))).toBe(
      'Until 31/12/2026',
    );
    expect(formatPlanPeriod(makePlan({ planStart: null, planEnd: null }))).toBe('No end date');
  });
});

describe('daysUntilPlanEnd', () => {
  it('counts whole days to the end date', () => {
    const plan = makePlan({ planEnd: '2026-09-10' });
    expect(daysUntilPlanEnd(plan, '2026-09-01T13:00:00.000Z')).toBe(9);
  });

  it('is zero on the last day and negative after it', () => {
    const plan = makePlan({ planEnd: '2026-09-01' });
    expect(daysUntilPlanEnd(plan, '2026-09-01T23:00:00.000Z')).toBe(0);
    expect(daysUntilPlanEnd(plan, '2026-09-03T00:00:00.000Z')).toBe(-2);
  });

  it('is null for a plan that never ends', () => {
    expect(daysUntilPlanEnd(makePlan({ planEnd: null }), '2026-09-01T00:00:00.000Z')).toBeNull();
    expect(daysUntilPlanEnd(null, '2026-09-01T00:00:00.000Z')).toBeNull();
  });
});

describe('countPlanUsage', () => {
  it('counts every tournament, and separately the ones under way', () => {
    // Paused counts as running: the slot is taken either way.
    const statuses = ['setup', 'running', 'paused', 'finished', 'registering'];
    expect(countPlanUsage(statuses, 4)).toEqual({
      tournaments: 5,
      runningTournaments: 2,
      backgrounds: 4,
    });
  });
});
