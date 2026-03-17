import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AQIDashboard from './components/AQIDashboard';
import AQIForecast from './components/AQIForecast';
import HealthAlerts from './components/HealthAlerts';
import SafeRoute from './components/SafeRoute';
import { aqiAPI } from './services/api';

// ── Simple page wrappers ─────────────────────────────────────────────────────
const PageWrapper = ({ children, title }) => (
  <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#f0f4ff 0%,#e8f5e9 100%)' }}>
    {children}
  </div>
);

const ForecastPage = ({ liveAqi }) => (
  <PageWrapper>
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 20px' }}>
      <AQIForecast location={{ lat:28.6139, lon:77.2090 }} />
    </div>
  </PageWrapper>
);

const AlertsPage = ({ liveAqi }) => (
  <PageWrapper>
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 20px' }}>
      <HealthAlerts currentAQI={liveAqi} />
    </div>
  </PageWrapper>
);

const RoutesPage = () => (
  <PageWrapper>
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 20px' }}>
      <SafeRoute />
    </div>
  </PageWrapper>
);

// ── App ──────────────────────────────────────────────────────────────────────
function App() {
  const [liveAqi, setLiveAqi] = useState(null);

  useEffect(() => {
    aqiAPI.getLive()
      .then(r => setLiveAqi(r.data?.aqi))
      .catch(() => {});
  }, []);

  return (
    <Router>
      <Navbar liveAqi={liveAqi} />
      <Routes>
        <Route path="/"          element={<AQIDashboard />} />
        <Route path="/dashboard" element={<AQIDashboard />} />
        <Route path="/forecast"  element={<ForecastPage  liveAqi={liveAqi} />} />
        <Route path="/alerts"    element={<AlertsPage    liveAqi={liveAqi} />} />
        <Route path="/routes"    element={<RoutesPage />} />
        {/* catch-all */}
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;