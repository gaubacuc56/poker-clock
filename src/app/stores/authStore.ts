import { create, type StoreApi, type UseBoundStore } from 'zustand';
import type { AuthGateway, AuthSession } from '@domain/ports';

interface AuthStoreState {
  session: AuthSession | null;
  isLoaded: boolean;
  init: () => () => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

export function createAuthStore(
  gateway: AuthGateway,
): UseBoundStore<StoreApi<AuthStoreState>> {
  return create<AuthStoreState>((set) => ({
    session: null,
    isLoaded: false,
    init: () => {
      gateway.getSession().then((session) => {
        set({ session, isLoaded: true });
      });
      return gateway.onChange((session) => {
        set({ session, isLoaded: true });
      });
    },
    signIn: (email, password) => gateway.signIn(email, password),
    signOut: () => gateway.signOut(),
  }));
}
