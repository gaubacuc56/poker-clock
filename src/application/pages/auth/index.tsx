import { useState } from 'react';
import { useAuthStore } from '@composition/container';
import PasswordInput from '@application/components/ui/PasswordInput';
import Screen from '@application/components/template/Screen';
import Brand from '@application/components/template/Brand';

export default function AuthPage() {
  const signIn = useAuthStore((state) => state.signIn);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const message = await signIn(email, password);
      if (message) setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <div className="scroll felt grid place-items-center px-6 py-7">
        <form onSubmit={handleSubmit} className="slab w-[min(360px,100%)] rounded-3xl p-6">
          <div className="mb-[18px] flex flex-col items-center gap-2.5">
            <Brand className="size-[88px]" glow />
            <span className="text-center text-[13px] tracking-[.26em] uppercase text-muted">
              Poker Tournament Clock
            </span>
          </div>

          <h1 className="mb-[3px] text-[30px]">Sign in</h1>

          <label className="mb-2.5 block">
            <span className="field-label">Email</span>
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="field-label">Password</span>
            <PasswordInput
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <p className="mt-2 text-[18px] text-coral">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary mt-4 h-11 w-full text-[18px]"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="mt-4 text-[14px] text-faint text-center">
            Accounts are created by the organizer.
          </p>
        </form>
      </div>
    </Screen>
  );
}
