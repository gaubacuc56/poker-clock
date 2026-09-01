import { create, type StoreApi, type UseBoundStore } from 'zustand';
import type { PlanRepository } from '@domain/ports';
import type { AccountPlan } from '@domain/entities';
import { loadOnce, type LoadOptions } from './loadOnce';

interface PlanStoreState {
  plan: AccountPlan | null;
  isLoaded: boolean;
  load: (options?: LoadOptions) => Promise<void>;
  reset: () => void;
}

/**
 * The account's allowances, loaded once at sign-in.
 *
 * `plan` stays null on failure rather than falling back to a guess: the rules in
 * `domain/rules/planLimits` treat an unknown plan as "allow it and let the
 * database decide", which is the right way round — a screen that blocks because
 * it couldn't read a limit is worse than one that tries and is refused.
 */
export function createPlanStore(
  repo: PlanRepository,
): UseBoundStore<StoreApi<PlanStoreState>> {
  return create<PlanStoreState>((set, get) => ({
    plan: null,
    isLoaded: false,
    load: loadOnce(
      () => get().isLoaded,
      async () => {
        try {
          set({ plan: await repo.getMine(), isLoaded: true });
        } catch (error) {
          console.error('Failed to load plan', error);
          set({ isLoaded: true });
        }
      },
    ),
    reset: () => set({ plan: null, isLoaded: false }),
  }));
}
