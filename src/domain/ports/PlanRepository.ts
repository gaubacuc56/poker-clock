import type { AccountPlan } from '../entities';

export interface PlanRepository {
  /** The plan in force for the signed-in account, allowances included. */
  getMine(): Promise<AccountPlan>;
}
