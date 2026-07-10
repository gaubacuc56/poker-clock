import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@composition/container';
import PageHeader from '../../components/layout/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import { ChevronRightIcon, LogoutIcon } from '../../components/icons';

const MENU = [
  { to: '/settings/profile', title: 'Profile', subtitle: 'Email and password' },
  { to: '/settings/backgrounds', title: 'Projector backgrounds', subtitle: 'Upload and manage images' },
];

export default function SettingsPage() {
  const signOut = useAuthStore((state) => state.signOut);

  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleConfirmSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      // Auth state change unmounts this screen; reset in case it doesn't.
      setIsSigningOut(false);
      setConfirmingSignOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-themed-primary text-themed-primary">
      <PageHeader />

      <div className="mx-auto max-w-3xl px-4 py-6 pb-20 sm:px-6 sm:py-10">
        <h1 className="mb-6 text-2xl font-semibold">Settings</h1>

        <div className="mb-8 space-y-3">
          {MENU.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="card flex items-center justify-between px-5 py-4"
            >
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-themed-muted">{item.subtitle}</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-themed-muted" />
            </Link>
          ))}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-themed bg-themed-secondary/80 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            className="btn-danger inline-flex w-full items-center justify-center gap-2"
            onClick={() => setConfirmingSignOut(true)}
          >
            <LogoutIcon className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingSignOut}
        title="Sign out?"
        message="You'll need to sign in again to manage tournaments."
        confirmLabel="Sign out"
        isBusy={isSigningOut}
        onConfirm={handleConfirmSignOut}
        onCancel={() => setConfirmingSignOut(false)}
      />
    </div>
  );
}
