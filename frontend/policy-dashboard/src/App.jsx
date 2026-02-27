import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import SourceAnalysis from './pages/SourceAnalysis';
import PolicyImpact from './pages/PolicyImpact';
import Simulation from './pages/Simulation';
import { helpers } from './services/api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const storedUser = helpers.getUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    helpers.removeAuthToken();
    setUser(null);
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading AirVision Policy Dashboard...</p>
      </div>
    );
  }

  // Mock authentication - in production, implement proper login
  if (!user) {
    // Set mock user for development
    const mockUser = {
      id: 1,
      username: 'policymaker',
      full_name: 'Policy Maker',
      user_type: 'policy_maker',
      email: 'policy@airvision.gov'
    };
    setUser(mockUser);
    helpers.setUser(mockUser);
  }

  return (
    <Router>
      <div className="app">
        <Sidebar user={user} onLogout={handleLogout} />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/source-analysis" element={<SourceAnalysis />} />
            <Route path="/policy-impact" element={<PolicyImpact />} />
            <Route path="/simulation" element={<Simulation />} />
            <Route path="/recommendations" element={<PolicyImpact />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;