import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { TeamProvider } from './context/TeamContext';
import { LeagueProvider } from './context/LeagueContext';
import { CompetitionProvider } from './context/CompetitionContext';
import { AuthProvider } from './context/AuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LeagueProvider>
          <TeamProvider>
            <CompetitionProvider>
              <App />
            </CompetitionProvider>
          </TeamProvider>
        </LeagueProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
