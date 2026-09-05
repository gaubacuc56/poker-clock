import { create, type StoreApi, type UseBoundStore } from 'zustand';
import type { AuthGateway, AuthSession } from '@domain/ports';
import type { AccountPlan } from '@domain/entities';
import { ACCOUNT_LOCKED_MESSAGE, isAccountLocked } from '@domain/rules/accountAccess';

interface AuthStoreState {
  session: AuthSession | null;
  isLoaded: boolean;
  /**
   * A sign-in is past the password and not finished yet.
   *
   * The session already exists at that point, so without this the app would
   * render a frame of itself between the password being accepted and the account
   * being refused. The auth screen stays up instead.
   */
  isSigningIn: boolean;
  init: () => () => void;
  /** Returns the message to show on the form, or null when the account is in. */
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
  /** The account's plan, read fresh — see `signIn`. */
  readPlan: () => Promise<AccountPlan | null>,
): UseBoundStore<StoreApi<AuthStoreState>> {
  return create<AuthStoreState>((set) => ({
    session: null,
    isLoaded: false,
    isSigningIn: false,
    init: () => {
      const apply = (session: AuthSession | null) =>
        set((state) => ({
          session: isSameAccount(state.session, session) ? state.session : session,
          isLoaded: true,
        }));

      gateway.getSession().then(apply);
      return gateway.onChange(apply);
    },
    signIn: async (email, password) => {
      set({ isSigningIn: true });
      try {
        const failure = await gateway.signIn(email, password);
        if (failure) return failure;

        // The password was right; the account still has to be allowed in. Both
        // outcomes leave the caller on the form, so a barred account reads a
        // failed sign-in rather than being let in and thrown out.
        if (isAccountLocked(await readPlan())) {
          await gateway.signOut();
          return ACCOUNT_LOCKED_MESSAGE;
        }
        return null;
      } finally {
        set({ isSigningIn: false });
      }
    },
    signOut: () => gateway.signOut(),
    changePassword: (currentPassword, newPassword) =>
      gateway.changePassword(currentPassword, newPassword),
  }));
}
