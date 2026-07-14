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
import { createClockSyncHooks } from '../application/hooks/useClockSync';
import { SupabaseTournamentRepository } from '../infrastructure/supabase/SupabaseTournamentRepository';
import { SupabaseAuthGateway } from '../infrastructure/supabase/SupabaseAuthGateway';
import { SupabaseCurrencyRepository } from '../infrastructure/supabase/SupabaseCurrencyRepository';
import { SupabaseBackgroundRepository } from '../infrastructure/supabase/SupabaseBackgroundRepository';
import { SupabaseClockSyncGateway } from '../infrastructure/supabase/SupabaseClockSyncGateway';

const tournamentRepository = new SupabaseTournamentRepository();

export const useTournamentStore = createTournamentStore(tournamentRepository);
export const useAuthStore = createAuthStore(new SupabaseAuthGateway());
export const useCurrencyStore = createCurrencyStore(new SupabaseCurrencyRepository());
export const useBackgroundStore = createBackgroundStore(new SupabaseBackgroundRepository());
export const { useClockSyncControl, useClockSyncProjector } = createClockSyncHooks(
  new SupabaseClockSyncGateway(),
);

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
