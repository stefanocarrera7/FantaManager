import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Roster from './pages/Roster';
import Finance from './pages/Finance';
import MarketDashboard from './features/market/MarketDashboard';
import AdminSetup from './pages/AdminSetup';
import CompetitionDashboard from './features/competition/CompetitionDashboard';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import RequireCompetition from './components/RequireCompetition';

import CompetitionSelect from './pages/CompetitionSelect';

import MyLeagues from './pages/MyLeagues';

// Placeholder Pages
const Market = () => {
  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700 }}>
          Transfer <span className="text-gradient">Market</span>
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Acquire new talent for your squad</p>
      </header>
      <MarketDashboard />
    </div>
  );
};
const Stadium = () => <div className="text-gradient" style={{ fontSize: '2rem' }}>Stadio (Coming Soon)</div>;

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        {/* New Home is My Leagues */}
        <Route path="/" element={<Navigate to="/my-leagues" replace />} />
        <Route path="/my-leagues" element={<MyLeagues />} />

        <Route path="/select-competition" element={<CompetitionSelect />} />

        <Route element={<RequireCompetition />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="market" element={<Market />} />
            <Route path="roster" element={<Roster />} />
            <Route path="finance" element={<Finance />} />
            <Route path="league" element={<CompetitionDashboard />} />
            <Route path="stadium" element={<Stadium />} />
            <Route path="admin" element={<AdminSetup />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
