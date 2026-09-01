import { useEffect, useRef } from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { resetAccountStores, useAuthStore } from '@composition/container';
import AuthPage from './application/pages/auth';
import DashboardPage from './application/pages/dashboard';
import SetupWizardPage from './application/pages/setup-wizard';
import ControlPage from './application/pages/control';
import ProjectorPage from './application/pages/projector';
import ProjectorEntryPage from './application/pages/projector-entry';
import PlayersPage from './application/pages/players';
import SettingsPage from './application/pages/settings';
import ProfilePage from './application/pages/profile';
import BackgroundsPage from './application/pages/backgrounds';
import PlanPage from './application/pages/plan';
import UnitsPage from './application/pages/units';
import NotFoundPage from './application/pages/not-found';
import Screen from '@application/components/template/Screen';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/p" element={<ProjectorEntryPage />} />
        <Route path="/p/:code" element={<ProjectorPage />} />
        <Route path="*" element={<AuthenticatedApp />} />
      </Routes>
    </BrowserRouter>
  );
}

function AuthenticatedApp() {
  const authIsLoaded = useAuthStore((state) => state.isLoaded);
  const session = useAuthStore((state) => state.session);
  const initAuth = useAuthStore((state) => state.init);

  const navigate = useNavigate();
  // Signing out leaves the URL where it was — the auth screen renders in place
  // of the routes rather than at a route of its own. Without this, signing back
  // in drops the account onto whatever screen the last session ended on.
  const wasSignedOut = useRef(false);

  useEffect(() => initAuth(), [initAuth]);

  useEffect(() => {
    if (!authIsLoaded) return;
    if (!session) {
      wasSignedOut.current = true;
      return;
    }
    // Only a fresh sign-in goes home. A restored session is a reload or a deep
    // link, and that URL is the one the account asked for.
    if (wasSignedOut.current) {
      wasSignedOut.current = false;
      navigate('/', { replace: true });
    }
  }, [authIsLoaded, session, navigate]);

  // Nothing is fetched here. Each screen asks for the lists it actually shows,
  // and the stores answer a second asker with the first one's request — so the
  // dashboard costs one query rather than four, and opening Settings fetches
  // nothing at all.
  //
  // What is left is the other half of "fetch once": dropping it. The stores
  // outlive a session, so the account that signs in next has to start empty.
  useEffect(() => {
    if (authIsLoaded && !session) resetAccountStores();
  }, [authIsLoaded, session]);

  if (!authIsLoaded) {
    // Through `Screen` so this first paint is already in the chosen theme —
    // `bg-themed-primary`/`text-themed-primary` were dead classes.
    return (
      <Screen>
        <div className="scroll felt grid place-items-center text-muted">Loading…</div>
      </Screen>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/settings/profile" element={<ProfilePage />} />
      <Route path="/settings/backgrounds" element={<BackgroundsPage />} />
      <Route path="/settings/units" element={<UnitsPage />} />
      <Route path="/settings/plan" element={<PlanPage />} />
      <Route path="/setup/new" element={<SetupWizardPage />} />
      <Route path="/setup/:id" element={<SetupWizardPage />} />
      <Route path="/tournament/:id/control" element={<ControlPage />} />
      <Route path="/tournament/:id/players" element={<PlayersPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
