import { create, type StoreApi, type UseBoundStore } from 'zustand';
import type { AuthGateway, AuthSession } from '@domain/ports';

interface AuthStoreState {
  session: AuthSession | null;
  isLoaded: boolean;
  init: () => () => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<string | null>;
}

function isSameAccount(a: AuthSession | null, b: AuthSession | null): boolean {
  if (!a || !b) return a === b;
  return a.userId === b.userId && a.email === b.email;
}

export function createAuthStore(
  gateway: AuthGateway,
): UseBoundStore<StoreApi<AuthStoreState>> {
  return create<AuthStoreState>((set) => ({
    session: null,
    isLoaded: false,
    init: () => {
      /**
       * Keeps the object it already has when the account hasn't changed.
       *
       * The gateway builds a fresh `AuthSession` for every auth event, and there
       * are a lot of them — the initial read, a token refresh roughly hourly,
       * and a re-check whenever the tab is brought back to the front. A new
       * object for the same account looks like a new session to anything
       * watching, which is how a background token refresh ended up re-running
       * every screen's data fetch.
       */
      const apply = (session: AuthSession | null) =>
        set((state) => ({
          session: isSameAccount(state.session, session) ? state.session : session,
          isLoaded: true,
        }));

      gateway.getSession().then(apply);
      return gateway.onChange(apply);
    },
    signIn: (email, password) => gateway.signIn(email, password),
    signOut: () => gateway.signOut(),
    changePassword: (currentPassword, newPassword) =>
      gateway.changePassword(currentPassword, newPassword),
  }));
}
