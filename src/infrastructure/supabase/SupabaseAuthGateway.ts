import type { Session } from '@supabase/supabase-js';
import type { AuthGateway, AuthSession } from '@domain/ports';
import { supabase } from './client';

function sessionToAuthSession(session: Session | null): AuthSession | null {
  if (!session) return null;
  return { userId: session.user.id, email: session.user.email ?? null };
}

export class SupabaseAuthGateway implements AuthGateway {
  async getSession(): Promise<AuthSession | null> {
    const { data } = await supabase.auth.getSession();
    return sessionToAuthSession(data.session);
  }

  onChange(callback: (session: AuthSession | null) => void): () => void {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(sessionToAuthSession(session));
    });
    return () => data.subscription.unsubscribe();
  }

  async signIn(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }
}
