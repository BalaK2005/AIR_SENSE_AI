import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AQIDashboard from './components/AQIDashboard';
import AQIForecast from './components/AQIForecast';
import HealthAlerts from './components/HealthAlerts';
import SafeRoute from './components/SafeRoute';
import AQIMap from './components/AQIMap';
import CitizenLogin from './components/CitizenLogin';
import { aqiAPI, helpers } from './services/api';

const Wrap = ({ children }) => (
  <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#f0f4ff 0%,#e8f5e9 100%)' }}>
    {children}
  </div>
);

const Page = ({ children }) => (
  <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 20px' }}>{children}</div>
);

const Protected = ({ user, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const [user, setUser]       = useState(null);
  const [liveAqi, setLiveAqi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = helpers.getUser();
    const token      = helpers.getAuthToken();
    if (storedUser && token) setUser(storedUser);
    setLoading(false);
    aqiAPI.getLive().then(r => setLiveAqi(r.data?.aqi)).catch(() => {});
  }, []);

  const handleLogin  = (u) => setUser(u);
  const handleLogout = () => { helpers.removeAuthToken(); setUser(null); };

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0f172a' }}>
      <div style={{ textAlign:'center', color:'white' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🌬️</div>
        <div style={{ fontSize:18, fontWeight:700 }}>Loading AirSense AI...</div>
      </div>
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <CitizenLogin onLogin={handleLogin} />} />
        <Route path="/*" element={
          <Protected user={user}>
            <>
              <Navbar liveAqi={liveAqi} user={user} onLogout={handleLogout} />
              <Routes>
                <Route path="/"          element={<AQIDashboard />} />
                <Route path="/dashboard" element={<AQIDashboard />} />
                <Route path="/forecast"  element={<Wrap><Page><AQIForecast location={{ lat:28.6139, lon:77.2090 }} /></Page></Wrap>} />
                <Route path="/alerts"    element={<Wrap><Page><HealthAlerts currentAQI={liveAqi} /></Page></Wrap>} />
                <Route path="/routes"    element={<Wrap><SafeRoute /></Wrap>} />
                <Route path="/map"       element={<Wrap><AQIMap /></Wrap>} />
                <Route path="*"          element={<Navigate to="/" replace />} />
              </Routes>
            </>
          </Protected>
        } />
      </Routes>
    </Router>
  );
}

export default App;
