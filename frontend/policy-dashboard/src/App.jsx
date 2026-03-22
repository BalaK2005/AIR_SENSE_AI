import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import SourceAnalysis from './pages/SourceAnalysis';
import PolicyImpact from './pages/PolicyImpact';
import Simulation from './pages/Simulation';
import Recommendations from './components/Recommendations';
import { helpers } from './services/api';
import './App.css';

const RecommendationsPage = () => (
  <div style={{ padding:32, maxWidth:1400, margin:'0 auto' }}>
    <h1 style={{ fontSize:32, fontWeight:900, margin:'0 0 6px 0', color:'#1a1a1a' }}>💡 AI Recommendations</h1>
    <p style={{ color:'#718096', margin:'0 0 28px 0', fontSize:15 }}>Real-time policy suggestions powered by live Delhi AQI data</p>
    <Recommendations region="Delhi" />
  </div>
);

const mockUser = {
  id: 1,
  username: 'policymaker',
  full_name: 'Policy Maker',
  user_type: 'policy_maker',
  email: 'policy@airvision.gov',
};

function App() {
  const [sidebarOpen, setSidebar] = useState(false);

  useEffect(() => {
    helpers.setUser(mockUser);
  }, []);

  const handleLogout = () => {
    // No-op for demo — just reload
    window.location.reload();
  };

  return (
    <Router>
      {/* Mobile sidebar toggle */}
      <button
        className="mobile-sidebar-toggle"
        onClick={() => setSidebar(o => !o)}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebar(false)}
      />

      <div className="app">
        <Sidebar
          user={mockUser}
          onLogout={handleLogout}
          className={sidebarOpen ? 'mobile-open' : ''}
          onNavClick={() => setSidebar(false)}
        />
        <main className="main-content">
          <Routes>
            <Route path="/"                element={<Overview />} />
            <Route path="/source-analysis" element={<SourceAnalysis />} />
            <Route path="/policy-impact"   element={<PolicyImpact />} />
            <Route path="/simulation"      element={<Simulation />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="*"               element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
