import { useEffect, useRef } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { resetAccountStores, useAuthStore, usePlanStore } from '@composition/container';
import { isAccountLocked } from '@domain/rules/accountAccess';
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
  const signOut = useAuthStore((state) => state.signOut);
  const isSigningIn = useAuthStore((state) => state.isSigningIn);

  const plan = usePlanStore((state) => state.plan);
  const planIsLoaded = usePlanStore((state) => state.isLoaded);
  const loadPlan = usePlanStore((state) => state.load);

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const wasSignedOut = useRef(false);

  useEffect(() => initAuth(), [initAuth]);

  useEffect(() => {
    if (session) void loadPlan({ force: true });
  }, [session, pathname, loadPlan]);

  useEffect(() => {
    if (!session || !planIsLoaded) return;
    if (isAccountLocked(plan)) void signOut();
  }, [session, planIsLoaded, plan, signOut]);

  useEffect(() => {
    if (!authIsLoaded) return;
    if (!session) {
      wasSignedOut.current = true;
      return;
    }
    if (wasSignedOut.current) {
      wasSignedOut.current = false;
      navigate('/', { replace: true });
    }
  }, [authIsLoaded, session, navigate]);

  useEffect(() => {
    if (authIsLoaded && !session) resetAccountStores();
  }, [authIsLoaded, session]);

  if (!authIsLoaded) {
    return (
      <Screen>
        <div className="scroll felt grid place-items-center text-muted">Loading…</div>
      </Screen>
    );
  }

  if (!session || isSigningIn) {
    return <AuthPage />;
  }

  if (!planIsLoaded) {
    return (
      <Screen>
        <div className="scroll felt grid place-items-center text-muted">Loading…</div>
      </Screen>
    );
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
