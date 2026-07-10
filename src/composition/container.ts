/**
 * The single file allowed to know about both `infrastructure/*` (concrete
 * Supabase adapters) and `app/*` (store/hook factories that only depend on
 * domain ports). Everything under `pages/`/`components/` imports its stores
 * and hooks from here instead of reaching into `app/` or `infrastructure/`
 * directly — swapping Supabase for a different backend means editing only
 * this file.
 */
import { createTournamentStore } from '../app/stores/tournamentStore';
import { createAuthStore } from '../app/stores/authStore';
import { createCurrencyStore } from '../app/stores/currencyStore';
import { createClockSyncHooks } from '../app/hooks/useClockSync';
import { SupabaseTournamentRepository } from '../infrastructure/supabase/SupabaseTournamentRepository';
import { SupabaseAuthGateway } from '../infrastructure/supabase/SupabaseAuthGateway';
import { SupabaseCurrencyRepository } from '../infrastructure/supabase/SupabaseCurrencyRepository';
import { SupabaseClockSyncGateway } from '../infrastructure/supabase/SupabaseClockSyncGateway';

const tournamentRepository = new SupabaseTournamentRepository();

export const useTournamentStore = createTournamentStore(tournamentRepository);
export const useAuthStore = createAuthStore(new SupabaseAuthGateway());
export const useCurrencyStore = createCurrencyStore(new SupabaseCurrencyRepository());
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
export { useClockStore } from '../app/stores/clockStore';
export { useClockTick } from '../app/hooks/useClockTick';
export { useToast } from '../app/hooks/useToast';

// Sound playback has no state worth a full port/factory, but still touches a
// browser API (Web Audio) — re-exported here so pages never import
// `infrastructure/*` directly, keeping that boundary absolute.
export { playSound } from '../infrastructure/sound/webAudioSound';
