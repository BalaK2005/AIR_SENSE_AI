import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import SourceAnalysis from './pages/SourceAnalysis';
import PolicyImpact from './pages/PolicyImpact';
import Simulation from './pages/Simulation';
import Recommendations from './components/Recommendations';
import PolicyLogin from './components/PolicyLogin';
import { helpers } from './services/api';
import './App.css';

const RecommendationsPage = () => (
  <div style={{ padding:32, maxWidth:1400, margin:'0 auto' }}>
    <div style={{ marginBottom:28 }}>
      <h1 style={{ fontSize:32, fontWeight:900, margin:0, color:'#1a1a1a' }}>💡 AI Recommendations</h1>
      <p style={{ color:'#718096', margin:'6px 0 0 0', fontSize:15 }}>Real-time policy suggestions powered by live Delhi AQI data</p>
    </div>
    <Recommendations region="Delhi" />
  </div>
);

const Protected = ({ user, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const [user, setUser]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [sidebarOpen, setSidebar] = useState(false);

  useEffect(() => {
    const storedUser = helpers.getUser();
    const token      = helpers.getAuthToken();
    if (storedUser && token) {
      setUser(storedUser);
    } else {
      const mockUser = { id:1, username:'policymaker', full_name:'Policy Maker', user_type:'policy_maker', email:'policy@airvision.gov' };
      setUser(mockUser);
      helpers.setUser(mockUser);
    }
    setLoading(false);
  }, []);

  const handleLogin  = (u) => setUser(u);
  const handleLogout = () => { helpers.removeAuthToken(); setUser(null); };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f8fafc' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🌬️</div>
        <p style={{ color:'#718096', fontSize:16 }}>Loading AirVision Policy Dashboard...</p>
      </div>
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <PolicyLogin onLogin={handleLogin} />} />
        <Route path="/*" element={
          <Protected user={user}>
            <>
              {/* Mobile sidebar toggle button */}
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
                  user={user}
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
            </>
          </Protected>
        } />
      </Routes>
    </Router>
  );
}

export default App;
