import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@composition/container';
import Screen from '../../components/layout/Screen';
import TopBar, { BackLink } from '../../components/layout/TopBar';
import ConfirmDialog from '../../components/ConfirmDialog';
import { ChevronRightIcon, LogoutIcon } from '../../components/icons';

const MENU = [
  { to: '/settings/profile', title: 'Profile', subtitle: 'Email and password' },
  {
    to: '/settings/backgrounds',
    title: 'Projector backgrounds',
    subtitle: 'Upload and manage images',
  },
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
    <Screen>
      <TopBar>
        <BackLink to="/" label="Back to dashboard" />
        <h1 className="text-[22px]">Settings</h1>
      </TopBar>

      <div className="scroll felt px-4 py-3.5">
        <div className="content flex flex-col gap-2">
          {MENU.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="btn w-full justify-start bg-surface px-3.5 py-3 text-left shadow-lift-sm"
            >
              <span className="flex-1">
                <span className="block text-[20px]">{item.title}</span>
                <span className="block text-[14px] text-faint">{item.subtitle}</span>
              </span>
              <ChevronRightIcon className="size-[15px] text-faint" />
            </Link>
          ))}
        </div>
      </div>

      <div className="bar bar-bottom">
        <div className="content">
          <button
            type="button"
            className="btn btn-danger-quiet h-[42px] w-full"
            onClick={() => setConfirmingSignOut(true)}
          >
            <LogoutIcon className="size-[17px]" />
            Sign out
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingSignOut}
        title="Sign out?"
        message="You will need your email and password to sign back in."
        confirmLabel="Sign out"
        isBusy={isSigningOut}
        onConfirm={handleConfirmSignOut}
        onCancel={() => setConfirmingSignOut(false)}
      />
    </Screen>
  );
}
