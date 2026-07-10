import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useAuthStore, useTournamentStore, useCurrencyStore } from '@composition/container';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import SetupWizardPage from './pages/SetupWizardPage';
import ControlPage from './pages/ControlPage';
import ProjectorPage from './pages/ProjectorPage';
import PlayersPage from './pages/PlayersPage';

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

  useEffect(() => initAuth(), [initAuth]);

  useEffect(() => {
    if (!session) return;
    loadTournaments();
    loadCurrencies();
  }, [session, loadTournaments, loadCurrencies]);

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
      <Route path="/setup/new" element={<SetupWizardPage />} />
      <Route path="/setup/:id" element={<SetupWizardPage />} />
      <Route path="/tournament/:id/control" element={<ControlPage />} />
      <Route path="/tournament/:id/players" element={<PlayersPage />} />
    </Routes>
  );
}

export default App;
