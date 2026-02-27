import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

const Home = () => {
  const [currentAQI, setCurrentAQI] = useState(null);
  const [nearbyStations, setNearbyStations] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(location);
          fetchNearbyAQI(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          fetchDefaultAQI();
        }
      );
    } else {
      fetchDefaultAQI();
    }
  };

  const fetchNearbyAQI = async (location) => {
    try {
      const response = await api.get('/aqi/current', {
        params: {
          lat: location.latitude,
          lon: location.longitude,
          radius: 10
        }
      });
      
      if (response.data && response.data.length > 0) {
        setNearbyStations(response.data);
        setCurrentAQI(response.data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching AQI:', error);
      setLoading(false);
    }
  };

  const fetchDefaultAQI = async () => {
    try {
      const response = await api.get('/aqi/current');
      if (response.data && response.data.length > 0) {
        setNearbyStations(response.data.slice(0, 5));
        setCurrentAQI(response.data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching AQI:', error);
      setLoading(false);
    }
  };

  const getAQIInfo = (aqi) => {
    if (!aqi) return { category: 'Unknown', color: '#718096', icon: '❓', gradient: 'linear-gradient(135deg, #718096 0%, #4a5568 100%)' };
    
    if (aqi <= 50) return { category: 'Good', color: '#00E400', icon: '😊', gradient: 'linear-gradient(135deg, #00E400 0%, #00FF00 100%)' };
    if (aqi <= 100) return { category: 'Satisfactory', color: '#FFFF00', icon: '🙂', gradient: 'linear-gradient(135deg, #FFFF00 0%, #FFD700 100%)' };
    if (aqi <= 200) return { category: 'Moderate', color: '#FF7E00', icon: '😐', gradient: 'linear-gradient(135deg, #FF7E00 0%, #FF8C00 100%)' };
    if (aqi <= 300) return { category: 'Poor', color: '#FF0000', icon: '😷', gradient: 'linear-gradient(135deg, #FF0000 0%, #DC143C 100%)' };
    if (aqi <= 400) return { category: 'Very Poor', color: '#8F3F97', icon: '😨', gradient: 'linear-gradient(135deg, #8F3F97 0%, #9932CC 100%)' };
    return { category: 'Severe', color: '#7E0023', icon: '🆘', gradient: 'linear-gradient(135deg, #7E0023 0%, #8B0000 100%)' };
  };

  const aqiInfo = currentAQI ? getAQIInfo(currentAQI.aqi) : getAQIInfo(null);

  if (loading) {
    return (
      <div className="home-loading">
        <div className="loader-ring"></div>
        <p>Loading air quality data...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section" style={{ background: aqiInfo.gradient }}>
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-icon">{aqiInfo.icon}</span>
            Breathe Aware, Live Better
          </h1>
          <p className="hero-subtitle">
            Real-time hyperlocal air quality monitoring for Delhi-NCR
          </p>

          {currentAQI && (
            <div className="hero-aqi-card">
              <div className="aqi-location">
                <span className="location-icon">📍</span>
                {currentAQI.station_name}
              </div>
              <div className="aqi-display">
                <div className="aqi-number">{Math.round(currentAQI.aqi)}</div>
                <div className="aqi-info">
                  <div className="aqi-category">{aqiInfo.category}</div>
                  <div className="aqi-time">Updated: {new Date(currentAQI.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            </div>
          )}

          <div className="hero-actions">
            <Link to="/dashboard" className="cta-button primary">
              <span>📊</span>
              View Dashboard
            </Link>
            <Link to="/routes" className="cta-button secondary">
              <span>🗺️</span>
              Find Safe Routes
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Powered by AI & Real-Time Data</h2>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🗺️</div>
            <h3>Hyperlocal Mapping</h3>
            <p>Block-level AQI data across Delhi-NCR with 100+ monitoring stations</p>
            <Link to="/dashboard" className="feature-link">Explore Map →</Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔮</div>
            <h3>72-Hour Forecast</h3>
            <p>AI-powered predictions using LSTM models for better planning</p>
            <Link to="/dashboard" className="feature-link">View Forecast →</Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🛣️</div>
            <h3>Safe Routes</h3>
            <p>AQI-optimized travel routes for healthier daily commutes</p>
            <Link to="/routes" className="feature-link">Plan Route →</Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h3>Smart Alerts</h3>
            <p>Personalized notifications when air quality deteriorates</p>
            <Link to="/dashboard" className="feature-link">Setup Alerts →</Link>
          </div>
        </div>
      </section>

      {/* Nearby Stations */}
      {nearbyStations.length > 0 && (
        <section className="nearby-section">
          <h2 className="section-title">Nearby Stations</h2>
          
          <div className="stations-grid">
            {nearbyStations.slice(0, 6).map((station) => {
              const stationInfo = getAQIInfo(station.aqi);
              return (
                <div key={station.station_id} className="station-card">
                  <div className="station-header">
                    <h4>{station.station_name}</h4>
                    <span className="station-category" style={{ color: stationInfo.color }}>
                      {stationInfo.category}
                    </span>
                  </div>
                  <div className="station-aqi" style={{ color: stationInfo.color }}>
                    {Math.round(station.aqi)}
                  </div>
                  {station.pm25 && (
                    <div className="station-pollutant">
                      <span>PM2.5:</span>
                      <span>{station.pm25.toFixed(1)} µg/m³</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Health Tips */}
      <section className="tips-section">
        <h2 className="section-title">Stay Protected</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <span className="tip-icon">😷</span>
            <h3>Wear N95 Masks</h3>
            <p>When AQI exceeds 200</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🏠</span>
            <h3>Stay Indoors</h3>
            <p>During severe pollution events</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🌳</span>
            <h3>Use Air Purifiers</h3>
            <p>Keep indoor air clean</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🚴</span>
            <h3>Plan Activities</h3>
            <p>Check forecast before outdoor plans</p>
          </div>
        </div>
      </section>

      <style jsx>{`
        .home-container {
          min-height: 100vh;
        }

        .home-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 80vh;
          gap: 20px;
        }

        .loader-ring {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(102, 126, 234, 0.2);
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .hero-section {
          padding: 80px 20px;
          color: white;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .hero-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="rgba(255,255,255,0.05)"/></svg>');
          background-size: 100px 100px;
          opacity: 0.3;
        }

        .hero-content {
          max-width: 800px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .hero-title {
          font-size: 56px;
          font-weight: 900;
          margin: 0 0 20px 0;
          line-height: 1.2;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .hero-icon {
          font-size: 64px;
        }

        .hero-subtitle {
          font-size: 20px;
          opacity: 0.95;
          margin: 0 0 40px 0;
          font-weight: 500;
        }

        .hero-aqi-card {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 32px;
          margin: 40px auto;
          max-width: 400px;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .aqi-location {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 16px;
          margin-bottom: 20px;
          font-weight: 600;
        }

        .aqi-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
        }

        .aqi-number {
          font-size: 80px;
          font-weight: 900;
          font-family: 'Space Mono', monospace;
          line-height: 1;
        }

        .aqi-category {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .aqi-time {
          font-size: 14px;
          opacity: 0.9;
        }

        .hero-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 40px;
        }

        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 32px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 16px;
          text-decoration: none;
          transition: all 0.3s;
        }

        .cta-button.primary {
          background: white;
          color: #667eea;
        }

        .cta-button.secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.5);
        }

        .cta-button:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .features-section,
        .nearby-section,
        .tips-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 20px;
        }

        .section-title {
          text-align: center;
          font-size: 40px;
          font-weight: 800;
          margin: 0 0 48px 0;
          color: #1a1a1a;
        }

        .features-grid,
        .tips-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }

        .feature-card,
        .tip-card {
          background: white;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.3s;
        }

        .feature-card:hover,
        .tip-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
        }

        .feature-icon,
        .tip-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 20px;
        }

        .feature-card h3,
        .tip-card h3 {
          font-size: 22px;
          font-weight: 800;
          margin: 0 0 12px 0;
          color: #1a1a1a;
        }

        .feature-card p,
        .tip-card p {
          color: #718096;
          line-height: 1.6;
          margin: 0 0 20px 0;
        }

        .feature-link {
          color: #667eea;
          font-weight: 700;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .feature-link:hover {
          gap: 8px;
        }

        .stations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .station-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.3s;
        }

        .station-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .station-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .station-header h4 {
          font-size: 16px;
          font-weight: 700;
          margin: 0;
          color: #1a1a1a;
        }

        .station-category {
          font-size: 12px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.05);
        }

        .station-aqi {
          font-size: 48px;
          font-weight: 900;
          font-family: 'Space Mono', monospace;
          margin-bottom: 12px;
        }

        .station-pollutant {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: #718096;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 36px;
          }

          .hero-icon {
            font-size: 40px;
          }

          .section-title {
            font-size: 28px;
          }

          .features-grid,
          .stations-grid,
          .tips-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;