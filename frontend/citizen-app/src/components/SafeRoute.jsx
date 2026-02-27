import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const SafeRoute = () => {
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [travelMode, setTravelMode] = useState('driving');
  const [routes, setRoutes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setStartLocation(`${position.coords.latitude},${position.coords.longitude}`);
          setUseCurrentLocation(true);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const findRoutes = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const [startLat, startLon] = startLocation.split(',');
      const [endLat, endLon] = endLocation.split(',');

      const response = await api.get('/route/safe-route', {
        params: {
          start_lat: parseFloat(startLat),
          start_lon: parseFloat(startLon),
          end_lat: parseFloat(endLat),
          end_lon: parseFloat(endLon),
          mode: travelMode
        }
      });

      setRoutes(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error finding routes:', error);
      setLoading(false);
    }
  };

  const getHealthImpactColor = (impact) => {
    const colors = {
      'Low': '#00E400',
      'Moderate': '#FFFF00',
      'High': '#FF7E00',
      'Very High': '#FF0000'
    };
    return colors[impact] || '#718096';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Good': '#00E400',
      'Satisfactory': '#FFFF00',
      'Moderate': '#FF7E00',
      'Poor': '#FF0000',
      'Very Poor': '#8F3F97',
      'Severe': '#7E0023'
    };
    return colors[category] || '#718096';
  };

  return (
    <div className="safe-route-container">
      <div className="route-form-card">
        <h2 className="form-title">
          <span className="title-icon">🗺️</span>
          Find Your Safest Route
        </h2>
        <p className="form-subtitle">
          Get AQI-optimized routes for healthier travel
        </p>

        <form onSubmit={findRoutes} className="route-form">
          <div className="form-group">
            <label>Starting Point</label>
            <div className="input-with-button">
              <input
                type="text"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                placeholder="Enter coordinates (lat,lon) or address"
                required
                className="location-input"
              />
              <button
                type="button"
                onClick={getCurrentLocation}
                className="location-btn"
                title="Use current location"
              >
                📍
              </button>
            </div>
            {useCurrentLocation && (
              <span className="location-status">✓ Using your current location</span>
            )}
          </div>

          <div className="form-group">
            <label>Destination</label>
            <input
              type="text"
              value={endLocation}
              onChange={(e) => setEndLocation(e.target.value)}
              placeholder="Enter coordinates (lat,lon) or address"
              required
              className="location-input"
            />
          </div>

          <div className="form-group">
            <label>Travel Mode</label>
            <div className="travel-modes">
              {[
                { value: 'driving', icon: '🚗', label: 'Drive' },
                { value: 'walking', icon: '🚶', label: 'Walk' },
                { value: 'cycling', icon: '🚴', label: 'Cycle' },
                { value: 'transit', icon: '🚌', label: 'Transit' }
              ].map(mode => (
                <button
                  key={mode.value}
                  type="button"
                  className={`mode-btn ${travelMode === mode.value ? 'active' : ''}`}
                  onClick={() => setTravelMode(mode.value)}
                >
                  <span className="mode-icon">{mode.icon}</span>
                  <span>{mode.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="find-route-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="btn-spinner"></span>
                Finding routes...
              </>
            ) : (
              <>
                <span>🔍</span>
                Find Safe Routes
              </>
            )}
          </button>
        </form>
      </div>

      {routes && (
        <div className="routes-results">
          {/* Safest Route - Featured */}
          <div className="route-card featured">
            <div className="route-badge">
              <span className="badge-icon">⭐</span>
              Safest Route
            </div>
            
            <h3 className="route-name">{routes.safest_route.name}</h3>
            
            <div className="route-stats">
              <div className="stat">
                <span className="stat-label">Distance</span>
                <span className="stat-value">{routes.safest_route.distance_km.toFixed(1)} km</span>
              </div>
              <div className="stat">
                <span className="stat-label">Time</span>
                <span className="stat-value">{routes.safest_route.estimated_time_minutes} min</span>
              </div>
              <div className="stat">
                <span className="stat-label">Avg AQI</span>
                <span 
                  className="stat-value aqi-value"
                  style={{ color: getCategoryColor(routes.safest_route.category) }}
                >
                  {Math.round(routes.safest_route.avg_aqi)}
                </span>
              </div>
            </div>

            <div className="route-quality">
              <div className="quality-bar">
                <div 
                  className="quality-fill"
                  style={{ 
                    width: `${100 - (routes.safest_route.avg_aqi / 5)}%`,
                    background: getCategoryColor(routes.safest_route.category)
                  }}
                ></div>
              </div>
              <span 
                className="quality-label"
                style={{ color: getCategoryColor(routes.safest_route.category) }}
              >
                {routes.safest_route.category}
              </span>
            </div>

            <div className="health-impact">
              <span className="impact-label">Health Impact:</span>
              <span 
                className="impact-badge"
                style={{ 
                  backgroundColor: getHealthImpactColor(routes.safest_route.health_impact) + '20',
                  color: getHealthImpactColor(routes.safest_route.health_impact)
                }}
              >
                {routes.safest_route.health_impact}
              </span>
            </div>

            <button className="view-details-btn">
              View Route Details →
            </button>
          </div>

          {/* Alternative Routes */}
          {routes.alternative_routes && routes.alternative_routes.length > 0 && (
            <div className="alternative-routes">
              <h3 className="alternatives-title">Alternative Routes</h3>
              {routes.alternative_routes.map((route, index) => (
                <div key={index} className="route-card">
                  <h4 className="route-name">{route.name}</h4>
                  
                  <div className="route-stats compact">
                    <div className="stat-compact">
                      <span className="stat-icon">📏</span>
                      {route.distance_km.toFixed(1)} km
                    </div>
                    <div className="stat-compact">
                      <span className="stat-icon">⏱️</span>
                      {route.estimated_time_minutes} min
                    </div>
                    <div className="stat-compact">
                      <span className="stat-icon">💨</span>
                      AQI {Math.round(route.avg_aqi)}
                    </div>
                  </div>

                  <div className="route-comparison">
                    <span className="comparison-label">vs Safest:</span>
                    <span className={`comparison-value ${
                      route.avg_aqi > routes.safest_route.avg_aqi ? 'worse' : 'better'
                    }`}>
                      {route.avg_aqi > routes.safest_route.avg_aqi ? '+' : ''}
                      {Math.round(route.avg_aqi - routes.safest_route.avg_aqi)} AQI
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .safe-route-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .route-form-card {
          background: white;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .form-title {
          font-size: 32px;
          font-weight: 800;
          margin: 0 0 8px 0;
          color: #1a1a1a;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .title-icon {
          font-size: 36px;
        }

        .form-subtitle {
          color: #718096;
          margin: 0 0 32px 0;
          font-size: 16px;
        }

        .route-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-weight: 600;
          color: #2d3748;
          font-size: 14px;
        }

        .input-with-button {
          display: flex;
          gap: 8px;
        }

        .location-input {
          flex: 1;
          padding: 14px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.2s;
        }

        .location-input:focus {
          outline: none;
          border-color: #4A90E2;
          box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
        }

        .location-btn {
          padding: 14px 20px;
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 20px;
        }

        .location-btn:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
        }

        .location-status {
          color: #00E400;
          font-size: 13px;
          font-weight: 600;
        }

        .travel-modes {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .mode-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 12px;
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 600;
          font-size: 14px;
        }

        .mode-btn:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
        }

        .mode-btn.active {
          background: #4A90E2;
          color: white;
          border-color: #4A90E2;
        }

        .mode-icon {
          font-size: 28px;
        }

        .find-route-btn {
          padding: 16px 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 8px;
        }

        .find-route-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .find-route-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .routes-results {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .route-card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.3s;
        }

        .route-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }

        .route-card.featured {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          position: relative;
          overflow: hidden;
        }

        .route-card.featured::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: shimmer 3s ease-in-out infinite;
        }

        @keyframes shimmer {
          0%, 100% { transform: translate(-50%, -50%); }
          50% { transform: translate(-30%, -30%); }
        }

        .route-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .route-name {
          font-size: 24px;
          font-weight: 800;
          margin: 0 0 20px 0;
        }

        .route-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 12px;
          opacity: 0.8;
          font-weight: 600;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 800;
          font-family: 'Space Mono', monospace;
        }

        .route-quality {
          margin: 20px 0;
        }

        .quality-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .quality-fill {
          height: 100%;
          transition: width 0.5s ease;
        }

        .quality-label {
          font-size: 14px;
          font-weight: 700;
        }

        .health-impact {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
        }

        .impact-label {
          font-size: 14px;
          font-weight: 600;
        }

        .impact-badge {
          padding: 6px 16px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 13px;
        }

        .view-details-btn {
          width: 100%;
          padding: 14px;
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 16px;
        }

        .view-details-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .alternative-routes {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .alternatives-title {
          font-size: 20px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 12px 0;
        }

        .route-stats.compact {
          display: flex;
          gap: 16px;
          margin: 12px 0;
        }

        .stat-compact {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #4a5568;
          font-size: 14px;
          font-weight: 600;
        }

        .route-comparison {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
        }

        .comparison-label {
          font-size: 13px;
          color: #718096;
        }

        .comparison-value {
          font-weight: 700;
          font-size: 14px;
        }

        .comparison-value.worse {
          color: #FF0000;
        }

        .comparison-value.better {
          color: #00E400;
        }

        @media (max-width: 768px) {
          .safe-route-container {
            padding: 12px;
          }

          .route-form-card {
            padding: 20px;
          }

          .travel-modes {
            grid-template-columns: repeat(2, 1fr);
          }

          .route-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default SafeRoute;
