import React, { useState, useEffect } from 'react';
import AQIMap from '../components/AQIMap';
import AQIForecast from '../components/AQIForecast';
import HealthAlerts from '../components/HealthAlerts';
import { api } from '../services/api';

const Dashboard = () => {
  const [selectedStation, setSelectedStation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [currentAQI, setCurrentAQI] = useState(null);
  const [view, setView] = useState('overview'); // overview, forecast, alerts

  useEffect(() => {
    getUserLocation();
    fetchCurrentAQI();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const fetchCurrentAQI = async () => {
    try {
      const response = await api.get('/aqi/current');
      if (response.data && response.data.length > 0) {
        setCurrentAQI(response.data[0].aqi);
      }
    } catch (error) {
      console.error('Error fetching AQI:', error);
    }
  };

  const handleStationSelect = (station) => {
    setSelectedStation(station);
    setView('forecast');
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Air Quality Dashboard</h1>
          <p className="dashboard-subtitle">Real-time monitoring and forecasts</p>
        </div>
        
        <div className="view-selector">
          <button 
            className={`view-btn ${view === 'overview' ? 'active' : ''}`}
            onClick={() => setView('overview')}
          >
            <span>📊</span>
            Overview
          </button>
          <button 
            className={`view-btn ${view === 'forecast' ? 'active' : ''}`}
            onClick={() => setView('forecast')}
          >
            <span>🔮</span>
            Forecast
          </button>
          <button 
            className={`view-btn ${view === 'alerts' ? 'active' : ''}`}
            onClick={() => setView('alerts')}
          >
            <span>🔔</span>
            Alerts
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Overview View */}
        {view === 'overview' && (
          <div className="overview-grid">
            <div className="map-section">
              <div className="section-card">
                <h2 className="section-title">
                  <span>🗺️</span>
                  Live Air Quality Map
                </h2>
                <AQIMap 
                  userLocation={userLocation}
                  selectedStation={selectedStation}
                  onStationSelect={handleStationSelect}
                />
              </div>
            </div>

            <div className="sidebar-section">
              {selectedStation ? (
                <div className="station-details-card">
                  <h3 className="card-title">Station Details</h3>
                  <div className="station-name">{selectedStation.station_name}</div>
                  
                  <div className="aqi-display-large">
                    <span className="aqi-label">Current AQI</span>
                    <span className="aqi-value">{Math.round(selectedStation.aqi)}</span>
                    <span className="aqi-category">{selectedStation.category}</span>
                  </div>

                  <div className="pollutants-grid">
                    {selectedStation.pm25 && (
                      <div className="pollutant-card">
                        <span className="pollutant-name">PM2.5</span>
                        <span className="pollutant-value">{selectedStation.pm25.toFixed(1)}</span>
                        <span className="pollutant-unit">µg/m³</span>
                      </div>
                    )}
                    {selectedStation.pm10 && (
                      <div className="pollutant-card">
                        <span className="pollutant-name">PM10</span>
                        <span className="pollutant-value">{selectedStation.pm10.toFixed(1)}</span>
                        <span className="pollutant-unit">µg/m³</span>
                      </div>
                    )}
                    {selectedStation.no2 && (
                      <div className="pollutant-card">
                        <span className="pollutant-name">NO₂</span>
                        <span className="pollutant-value">{selectedStation.no2.toFixed(1)}</span>
                        <span className="pollutant-unit">µg/m³</span>
                      </div>
                    )}
                    {selectedStation.so2 && (
                      <div className="pollutant-card">
                        <span className="pollutant-name">SO₂</span>
                        <span className="pollutant-value">{selectedStation.so2.toFixed(1)}</span>
                        <span className="pollutant-unit">µg/m³</span>
                      </div>
                    )}
                  </div>

                  <button 
                    className="view-forecast-btn"
                    onClick={() => setView('forecast')}
                  >
                    View 72h Forecast →
                  </button>
                </div>
              ) : (
                <div className="placeholder-card">
                  <span className="placeholder-icon">👆</span>
                  <p>Select a station on the map to view details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Forecast View */}
        {view === 'forecast' && (
          <div className="forecast-view">
            {selectedStation ? (
              <>
                <div className="forecast-header-info">
                  <h2>{selectedStation.station_name}</h2>
                  <p>Current AQI: <strong>{Math.round(selectedStation.aqi)}</strong></p>
                </div>
                <AQIForecast stationId={selectedStation.station_id} />
              </>
            ) : (
              <div className="no-station-selected">
                <span className="empty-icon">📊</span>
                <h3>No Station Selected</h3>
                <p>Please select a station from the map to view forecast</p>
                <button onClick={() => setView('overview')} className="back-btn">
                  Go to Map
                </button>
              </div>
            )}
          </div>
        )}

        {/* Alerts View */}
        {view === 'alerts' && (
          <div className="alerts-view">
            <HealthAlerts 
              currentAQI={currentAQI}
              userLocation={userLocation}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          background: #f7fafc;
          padding-bottom: 40px;
        }

        .dashboard-header {
          background: white;
          padding: 32px 40px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 24px;
        }

        .dashboard-title {
          font-size: 32px;
          font-weight: 800;
          margin: 0;
          color: #1a1a1a;
        }

        .dashboard-subtitle {
          color: #718096;
          margin: 4px 0 0 0;
          font-size: 14px;
        }

        .view-selector {
          display: flex;
          gap: 8px;
          background: #f7fafc;
          padding: 4px;
          border-radius: 12px;
        }

        .view-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: transparent;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          color: #4a5568;
          font-size: 14px;
        }

        .view-btn:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        .view-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .dashboard-content {
          max-width: 1600px;
          margin: 0 auto;
          padding: 32px 20px;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 24px;
        }

        .map-section,
        .sidebar-section {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .section-card,
        .station-details-card,
        .placeholder-card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .section-title {
          font-size: 20px;
          font-weight: 800;
          margin: 0 0 20px 0;
          color: #1a1a1a;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .card-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 20px 0;
          color: #1a1a1a;
        }

        .station-name {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 24px;
        }

        .aqi-display-large {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          margin-bottom: 24px;
        }

        .aqi-label {
          display: block;
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 12px;
          font-weight: 600;
        }

        .aqi-value {
          display: block;
          font-size: 64px;
          font-weight: 900;
          font-family: 'Space Mono', monospace;
          line-height: 1;
          margin-bottom: 8px;
        }

        .aqi-category {
          display: block;
          font-size: 20px;
          font-weight: 700;
        }

        .pollutants-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .pollutant-card {
          background: #f7fafc;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pollutant-name {
          font-size: 12px;
          font-weight: 700;
          color: #718096;
        }

        .pollutant-value {
          font-size: 28px;
          font-weight: 800;
          color: #1a1a1a;
          font-family: 'Space Mono', monospace;
        }

        .pollutant-unit {
          font-size: 12px;
          color: #a0aec0;
        }

        .view-forecast-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 15px;
        }

        .view-forecast-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .placeholder-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 60px 40px;
          color: #a0aec0;
        }

        .placeholder-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .forecast-view,
        .alerts-view {
          max-width: 1200px;
          margin: 0 auto;
        }

        .forecast-header-info {
          background: white;
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .forecast-header-info h2 {
          font-size: 24px;
          font-weight: 800;
          margin: 0 0 8px 0;
          color: #1a1a1a;
        }

        .forecast-header-info p {
          color: #718096;
          margin: 0;
        }

        .no-station-selected {
          background: white;
          border-radius: 20px;
          padding: 80px 40px;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .empty-icon {
          font-size: 80px;
          display: block;
          margin-bottom: 24px;
        }

        .no-station-selected h3 {
          font-size: 28px;
          font-weight: 800;
          margin: 0 0 12px 0;
          color: #1a1a1a;
        }

        .no-station-selected p {
          color: #718096;
          margin: 0 0 32px 0;
          font-size: 16px;
        }

        .back-btn {
          padding: 14px 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 15px;
        }

        .back-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        @media (max-width: 1200px) {
          .overview-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .dashboard-header {
            padding: 20px;
          }

          .dashboard-title {
            font-size: 24px;
          }

          .view-selector {
            width: 100%;
          }

          .view-btn {
            flex: 1;
            justify-content: center;
            padding: 10px 12px;
            font-size: 13px;
          }

          .aqi-value {
            font-size: 48px;
          }

          .pollutants-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;