import { describe, expect, it, vi } from 'vitest';

/**
 * Every authenticated screen, rendered once.
 *
 * Not a test of what any of them show — that is what the domain tests are for.
 * This catches the class of break that no type check sees and no unit test
 * touches: a page that throws on its first render and leaves the app a blank
 * screen. An identifier used in JSX but never declared, a hook called without
 * being imported, a store field that moved.
 *
 * The Supabase client is stubbed rather than mocked per-repository, so a screen
 * reaches its real store and its real fetch on mount and simply gets nothing
 * back — which is also the state a page has to render correctly anyway.
 */

vi.hoisted(() => {
  // jsdom in this Node build has no localStorage, and the theme store reads it
  // while the module is still being imported.
  const stored = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => void stored.set(key, value),
      removeItem: (key: string) => void stored.delete(key),
      clear: () => stored.clear(),
    },
    configurable: true,
  });
});

vi.mock('@infrastructure/supabase/client', () => {
  const empty = { data: [], error: null };

  /** Answers every query-builder method with itself, and every await with no rows. */
  const query: Record<string, unknown> = new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === 'then') return (resolve: (value: unknown) => unknown) => resolve(empty);
        return () => query;
      },
    },
  );

  return {
    supabase: {
      from: () => query,
      auth: {
        getUser: async () => ({ data: { user: null } }),
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      },
      storage: {
        from: () => ({
          list: async () => empty,
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
      },
      channel: () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) }),
      removeChannel: () => {},
    },
  };
});

import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BackgroundsPage from './backgrounds';
import ControlPage from './control';
import DashboardPage from './dashboard';
import PlanPage from './plan';
import PlayersPage from './players';
import ProfilePage from './profile';
import SettingsPage from './settings';
import SetupWizardPage from './setup-wizard';
import UnitsPage from './units';

const PAGES = {
  backgrounds: <BackgroundsPage />,
  control: <ControlPage />,
  dashboard: <DashboardPage />,
  plan: <PlanPage />,
  players: <PlayersPage />,
  profile: <ProfilePage />,
  settings: <SettingsPage />,
  'setup wizard': <SetupWizardPage />,
  units: <UnitsPage />,
};

describe('every screen renders', () => {
  for (const [name, element] of Object.entries(PAGES)) {
    it(name, () => {
      const { container } = render(<MemoryRouter>{element}</MemoryRouter>);
      expect(container.innerHTML).not.toBe('');
    });
  }
});
