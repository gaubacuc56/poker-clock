import { useState } from 'react';
import { useAuthStore, useToast } from '@composition/container';
import Screen from '../../components/layout/Screen';
import TopBar, { BackLink } from '../../components/layout/TopBar';
import PasswordInput from '../../components/PasswordInput';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';

export default function ProfilePage() {
  const email = useAuthStore((state) => state.session?.email ?? '');
  const changePassword = useAuthStore((state) => state.changePassword);
  const { toastMessage, showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (newPassword === currentPassword) {
      setError('New password must be different from your current password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const message = await changePassword(currentPassword, newPassword);
      if (message) {
        setError(message);
      } else {
        setCurrentPassword('');
        setNewPassword('');
        showToast('Password updated.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <TopBar>
        <BackLink to="/settings" label="Back to settings" />
        <h1 className="text-[22px]">Profile</h1>
      </TopBar>

      <div className="scroll felt p-4">
        <form onSubmit={handleSubmit} className="content flex flex-col gap-3">
          <label className="block">
            <span className="field-label">Email</span>
            <input type="email" className="input" value={email} disabled />
          </label>

          <hr className="hr" />

          <label className="block">
            <span className="field-label">Current password</span>
            <PasswordInput
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
              required
            />
          </label>

          <label className="block">
            <span className="field-label">New password</span>
            <PasswordInput
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              required
            />
          </label>

          {error && <p className="text-[18px] text-coral">{error}</p>}

          <button type="submit" className="btn btn-primary h-10 self-start" disabled={isSubmitting}>
            {isSubmitting && <Spinner />}
            Update password
          </button>
        </form>
      </div>

      <Toast message={toastMessage} />
    </Screen>
  );
}
