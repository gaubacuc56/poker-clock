import type { AuthError, Session } from '@supabase/supabase-js';
import type { AuthGateway, AuthSession } from '@domain/ports';
import { ACCOUNT_LOCKED_MESSAGE } from '@domain/rules/accountAccess';
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
    return error ? signInFailure(error) : null;
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    const email = data.session?.user.email;
    if (!email) return 'Not signed in.';

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (reauthError) return 'Current password is incorrect.';

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return error?.message ?? null;
  }
}

function signInFailure(error: AuthError): string {
  return /account_inactive/i.test(error.message) ? ACCOUNT_LOCKED_MESSAGE : error.message;
}
