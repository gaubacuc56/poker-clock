import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore, useThemeStore } from '@composition/container';
import Screen from '@application/components/template/Screen';
import TopBar from '@application/components/template/TopBar';
import BackLink from '@application/components/template/TopBar/sections/BackLink';
import ConfirmDialog from '@application/components/ui/ConfirmDialog';
import {
  CardIcon,
  ChevronRightIcon,
  CoinIcon,
  LogoutIcon,
  MoonIcon,
  ProjectorIcon,
  SunIcon,
  UserIcon,
} from '@application/components/ui/icons';

const MENU = [
  { to: '/settings/profile', title: 'Account settings', Icon: UserIcon },
  { to: '/settings/plan', title: 'Plan', Icon: CardIcon },
  { to: '/settings/units', title: 'Units', Icon: CoinIcon },
  { to: '/settings/backgrounds', title: 'Projector backgrounds', Icon: ProjectorIcon },
];

export default function SettingsPage() {
  const signOut = useAuthStore((state) => state.signOut);
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const isDark = theme === 'dark';
  const themeLabel = isDark ? 'Switch to light mode' : 'Switch to dark mode';

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
        <button
          type="button"
          className="btn btn-icon btn-secondary ml-auto"
          title={themeLabel}
          aria-label={themeLabel}
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
          {isDark ? <SunIcon className="size-[17px]" /> : <MoonIcon className="size-[17px]" />}
        </button>
      </TopBar>

      <div className="scroll felt px-4 py-3.5">
        <div className="content flex flex-col gap-2">
          {MENU.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="btn w-full justify-start bg-surface px-4 py-3 text-left shadow-lift-sm"
            >
              <item.Icon className="size-[19px] shrink-0 text-muted" />
              <span className="flex-1 text-lg ml-1">{item.title}</span>
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
