import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AQIDashboard from './components/AQIDashboard';
import AQIForecast from './components/AQIForecast';
import HealthAlerts from './components/HealthAlerts';
import SafeRoute from './components/SafeRoute';
import AQIMap from './components/AQIMap';
import { aqiAPI } from './services/api';

const Wrap = ({ children }) => (
  <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#f0f4ff 0%,#e8f5e9 100%)' }}>
    {children}
  </div>
);

const Page = ({ children }) => (
  <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 20px' }}>{children}</div>
);

function App() {
  const [liveAqi, setLiveAqi] = useState(null);

  useEffect(() => {
    aqiAPI.getLive().then(r => setLiveAqi(r.data?.aqi)).catch(() => {});
  }, []);

  return (
    <Router>
      <Navbar liveAqi={liveAqi} />
      <Routes>
        <Route path="/"          element={<AQIDashboard />} />
        <Route path="/dashboard" element={<AQIDashboard />} />
        <Route path="/map"       element={<Wrap><AQIMap /></Wrap>} />
        <Route path="/forecast"  element={<Wrap><Page><AQIForecast location={{ lat:28.6139, lon:77.2090 }} /></Page></Wrap>} />
        <Route path="/alerts"    element={<Wrap><Page><HealthAlerts currentAQI={liveAqi} /></Page></Wrap>} />
        <Route path="/routes"    element={<Wrap><SafeRoute /></Wrap>} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
