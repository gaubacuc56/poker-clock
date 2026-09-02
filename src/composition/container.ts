/**
 * The single file allowed to know about both `infrastructure/*` (concrete
 * Supabase adapters) and `app/*` (store/hook factories that only depend on
 * domain ports). Everything under `pages/`/`components/` imports its stores
 * and hooks from here instead of reaching into `app/` or `infrastructure/`
 * directly — swapping Supabase for a different backend means editing only
 * this file.
 */
import { createTournamentStore } from '../application/stores/tournamentStore';
import { createAuthStore } from '../application/stores/authStore';
import { createCurrencyStore } from '../application/stores/currencyStore';
import { createBackgroundStore } from '../application/stores/backgroundStore';
import { createPlanStore } from '../application/stores/planStore';
import { createClockSyncHooks } from '../application/hooks/useClockSync';
import { SupabaseTournamentRepository } from '../infrastructure/supabase/SupabaseTournamentRepository';
import { SupabaseAuthGateway } from '../infrastructure/supabase/SupabaseAuthGateway';
import { SupabaseCurrencyRepository } from '../infrastructure/supabase/SupabaseCurrencyRepository';
import { SupabaseBackgroundRepository } from '../infrastructure/supabase/SupabaseBackgroundRepository';
import { SupabasePlanRepository } from '../infrastructure/supabase/SupabasePlanRepository';
import { SupabaseClockSyncGateway } from '../infrastructure/supabase/SupabaseClockSyncGateway';

const tournamentRepository = new SupabaseTournamentRepository();

export const useTournamentStore = createTournamentStore(tournamentRepository);
export const useCurrencyStore = createCurrencyStore(new SupabaseCurrencyRepository());
export const useBackgroundStore = createBackgroundStore(new SupabaseBackgroundRepository());
export const usePlanStore = createPlanStore(new SupabasePlanRepository());

export const useAuthStore = createAuthStore(new SupabaseAuthGateway(), async () => {
  await usePlanStore.getState().load({ force: true });
  return usePlanStore.getState().plan;
});
export const { useClockSyncControl, useClockSyncProjector } = createClockSyncHooks(
  new SupabaseClockSyncGateway(),
);

/**
 * Empties every store that holds one account's data.
 *
 * The stores are module singletons that fetch once and keep what they got, so
 * without this the next account to sign in on the same tab would be shown the
 * last one's tournaments, units and images until something forced a refetch.
 * This file is the only one allowed to know all of them at once.
 */
export function resetAccountStores(): void {
  useTournamentStore.getState().reset();
  useCurrencyStore.getState().reset();
  useBackgroundStore.getState().reset();
  usePlanStore.getState().reset();
}

/**
 * Public, unauthenticated lookup for the projector view (/p/:joinCode) —
 * deliberately not a Zustand store, since it's a single one-off fetch for a
 * page that isn't behind the auth gate and holds no shared app state.
 */
export function findTournamentByJoinCode(code: string) {
  return tournamentRepository.findByJoinCode(code);
}

// No infrastructure dependency — re-exported here so the UI only ever needs
// one import path for state (`@composition/container`), never `app/*` directly.
export { useClockStore } from '../application/stores/clockStore';
export { useThemeStore, type Theme } from '../application/stores/themeStore';
export { useClockTick } from '../application/hooks/useClockTick';
export { useToast } from '../application/hooks/useToast';
export { useTournamentClock } from '../application/hooks/useTournamentClock';
export { useClockSounds } from '../application/hooks/useClockSounds';

// Sound playback has no state worth a full port/factory, but still touches a
// browser API (HTMLAudioElement) — re-exported here so pages never import
// `infrastructure/*` directly, keeping that boundary absolute.
export { playSound, primeSounds } from '../infrastructure/sound/mp3Sound';

// Public, unauthenticated lookup for the projector view — resolves a
// projectorBackgroundId to a URL without needing the (auth-gated) background
// store, re-exported directly for the same reason as `playSound` above.
export { resolveBackgroundPath } from '../infrastructure/supabase/SupabaseBackgroundRepository';
