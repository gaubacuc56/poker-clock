import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore, useToast } from '@composition/container';
import PageHeader from '../../components/layout/PageHeader';
import PasswordInput from '../../components/PasswordInput';
import Toast from '../../components/Toast';
import { ChevronLeftIcon } from '../../components/icons';
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
    <div className="min-h-screen bg-themed-primary text-themed-primary">
      <PageHeader />

      <div className="mx-auto max-w-sm px-4 py-6 sm:px-6 sm:py-10">
        <Link
          to="/settings"
          className="btn-ghost mb-4 inline-flex items-center gap-1.5 px-0 text-sm"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to Settings
        </Link>

        <h1 className="mb-6 text-2xl font-semibold">Profile</h1>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-themed-muted">Email</span>
          <input type="email" className="input" value={email} disabled />
        </label>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm text-themed-muted">Current password</span>
            <PasswordInput
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-themed-muted">New password</span>
            <PasswordInput
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              required
            />
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            className="btn-primary inline-flex w-full items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting && <Spinner />}
            Change password
          </button>
        </form>
      </div>

      <Toast message={toastMessage} />
    </div>
  );
}
