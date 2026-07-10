import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import {
  useAuthStore,
  useTournamentStore,
  useCurrencyStore,
  useBackgroundStore,
} from '@composition/container';
import AuthPage from './application/pages/auth';
import DashboardPage from './application/pages/dashboard';
import SetupWizardPage from './application/pages/setup-wizard';
import ControlPage from './application/pages/control';
import ProjectorPage from './application/pages/projector';
import PlayersPage from './application/pages/players';
import SettingsPage from './application/pages/settings';
import ProfilePage from './application/pages/profile';
import BackgroundsPage from './application/pages/backgrounds';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public — no auth gate. A TV opens this directly via a short typed code. */}
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

  const loadTournaments = useTournamentStore((state) => state.load);
  const loadCurrencies = useCurrencyStore((state) => state.load);
  const loadBackgrounds = useBackgroundStore((state) => state.load);

  useEffect(() => initAuth(), [initAuth]);

  useEffect(() => {
    if (!session) return;
    loadTournaments();
    loadCurrencies();
    loadBackgrounds();
  }, [session, loadTournaments, loadCurrencies, loadBackgrounds]);

  if (!authIsLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-themed-primary text-themed-primary">
        Loading…
      </div>
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
      <Route path="/setup/new" element={<SetupWizardPage />} />
      <Route path="/setup/:id" element={<SetupWizardPage />} />
      <Route path="/tournament/:id/control" element={<ControlPage />} />
      <Route path="/tournament/:id/players" element={<PlayersPage />} />
    </Routes>
  );
}

export default App;
