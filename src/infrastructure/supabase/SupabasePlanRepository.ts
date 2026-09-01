import type { PlanRepository } from '@domain/ports';
import type { AccountPlan } from '@domain/entities';
import { FALLBACK_PLAN_CODE } from '@domain/rules/planLimits';
import { supabase } from './client';

/**
 * The plan is read through `get_my_plan()` rather than by selecting `profiles`
 * and joining `plans`: which plan is actually in force depends on today's date
 * against the two nullable bounds, and that rule is what the limit triggers and
 * the storage policy enforce. One reading of it, in the database, is the only
 * way the screen and the enforcement can agree.
 */
export class SupabasePlanRepository implements PlanRepository {
  async getMine(): Promise<AccountPlan> {
    const { data, error } = await supabase.rpc('get_my_plan');
    if (error) throw error;

    const row = data?.[0];
    // No row means no profile — an account created before the trigger existed,
    // say. It is on the fallback tier with no dates, which is exactly what the
    // database would conclude too.
    if (!row) {
      return {
        planCode: FALLBACK_PLAN_CODE,
        planStart: null,
        planEnd: null,
        isActive: false,
        maxTour: null,
        maxRunningTour: null,
        maxBackground: null,
      };
    }

    return {
      planCode: row.plan_code,
      planStart: row.plan_start,
      planEnd: row.plan_end,
      isActive: row.is_active,
      maxTour: row.max_tour,
      maxRunningTour: row.max_running_tour,
      maxBackground: row.max_background,
    };
  }
}
