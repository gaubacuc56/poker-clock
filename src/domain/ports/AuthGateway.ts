export interface AuthSession {
  userId: string;
  email: string | null;
}

export interface AuthGateway {
  getSession(): Promise<AuthSession | null>;
  /** Returns an unsubscribe function. */
  onChange(callback: (session: AuthSession | null) => void): () => void;
  signIn(email: string, password: string): Promise<string | null>;
  signOut(): Promise<void>;
  /** Verifies `currentPassword` before applying `newPassword`. Returns an error message, or null on success. */
  changePassword(currentPassword: string, newPassword: string): Promise<string | null>;
}
