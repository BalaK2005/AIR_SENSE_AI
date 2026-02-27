import React, { useState, useEffect } from 'react';
import RegionalMap from '../components/RegionalMap';
import { api } from '../services/api';

const Overview = () => {
  const [selectedRegion, setSelectedRegion] = useState('Delhi');
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, [selectedRegion]);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const [aqiRes, statsRes] = await Promise.all([
        api.get('/aqi/current'),
        api.get('/policy/analytics')
      ]);

      setOverviewData({
        stations: aqiRes.data,
        analytics: statsRes.data
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching overview data:', error);
      setLoading(false);
    }
  };

  const getRegionalStats = () => {
    if (!overviewData?.stations) return null;

    const regionStations = overviewData.stations.filter(s => 
      s.city?.toLowerCase().includes(selectedRegion.toLowerCase())
    );

    if (regionStations.length === 0) return null;

    const avgAQI = regionStations.reduce((sum, s) => sum + s.aqi, 0) / regionStations.length;
    return {
      avgAQI: Math.round(avgAQI),
      stationCount: regionStations.length,
      good: regionStations.filter(s => s.aqi <= 50).length,
      moderate: regionStations.filter(s => s.aqi > 50 && s.aqi <= 200).length,
      poor: regionStations.filter(s => s.aqi > 200).length
    };
  };

  const regionalStats = getRegionalStats();

  return (
    <div className="overview-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Delhi-NCR Air Quality Overview</h1>
          <p className="page-subtitle">Real-time monitoring and regional analysis</p>
        </div>
        
        <div className="header-actions">
          <button className="action-btn">
            <span>📊</span>
            Export Report
          </button>
          <button className="action-btn primary">
            <span>🔄</span>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">🗺️</span>
            <span className="metric-label">Region</span>
          </div>
          <div className="metric-value">{selectedRegion}</div>
          <div className="metric-detail">
            {regionalStats?.stationCount || 0} monitoring stations
          </div>
        </div>

        <div className="metric-card highlight">
          <div className="metric-header">
            <span className="metric-icon">💨</span>
            <span className="metric-label">Average AQI</span>
          </div>
          <div className="metric-value">{regionalStats?.avgAQI || 'N/A'}</div>
          <div className="metric-detail">Current air quality index</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">✅</span>
            <span className="metric-label">Good Quality</span>
          </div>
          <div className="metric-value">{regionalStats?.good || 0}</div>
          <div className="metric-detail">stations with AQI ≤ 50</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">⚠️</span>
            <span className="metric-label">Poor Quality</span>
          </div>
          <div className="metric-value">{regionalStats?.poor || 0}</div>
          <div className="metric-detail">stations with AQI  200</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="content-grid">
        {/* Map Section */}
        <div className="map-section">
          <div className="section-card">
            <div className="section-header">
              <h2>Regional Air Quality Map</h2>
              <span className="live-indicator">
                <span className="pulse-dot"></span>
                Live
              </span>
            </div>
            <RegionalMap 
              selectedRegion={selectedRegion}
              onRegionSelect={setSelectedRegion}
            />
          </div>
        </div>

        {/* Side Panel */}
        <div className="side-panel">
          {/* Current Status */}
          <div className="status-card">
            <h3 className="card-title">Current Status - {selectedRegion}</h3>
            
            {regionalStats ? (
              <>
                <div className="status-aqi">
                  <span className="aqi-number">{regionalStats.avgAQI}</span>
                  <span className="aqi-label">Average AQI</span>
                </div>

                <div className="distribution-chart">
                  <div className="dist-item">
                    <div className="dist-bar good" style={{ width: `${(regionalStats.good / regionalStats.stationCount) * 100}%` }}></div>
                    <span className="dist-label">Good: {regionalStats.good}</span>
                  </div>
                  <div className="dist-item">
                    <div className="dist-bar moderate" style={{ width: `${(regionalStats.moderate / regionalStats.stationCount) * 100}%` }}></div>
                    <span className="dist-label">Moderate: {regionalStats.moderate}</span>
                  </div>
                  <div className="dist-item">
                    <div className="dist-bar poor" style={{ width: `${(regionalStats.poor / regionalStats.stationCount) * 100}%` }}></div>
                    <span className="dist-label">Poor: {regionalStats.poor}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="no-data">Select a region to view statistics</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="actions-card">
            <h3 className="card-title">Quick Actions</h3>
            <div className="action-buttons">
              <button className="quick-btn">
                <span>🎯</span>
                Run Simulation
              </button>
              <button className="quick-btn">
                <span>📈</span>
                View Trends
              </button>
              <button className="quick-btn">
                <span>💡</span>
                Get Recommendations
              </button>
              <button className="quick-btn">
                <span>📋</span>
                Policy History
              </button>
            </div>
          </div>

          {/* Alerts */}
          <div className="alerts-card">
            <h3 className="card-title">Active Alerts</h3>
            <div className="alert-list">
              <div className="alert-item critical">
                <span className="alert-icon">🚨</span>
                <div className="alert-content">
                  <strong>Critical AQI</strong>
                  <p>3 stations exceed 400 AQI</p>
                </div>
              </div>
              <div className="alert-item warning">
                <span className="alert-icon">⚠️</span>
                <div className="alert-content">
                  <strong>Policy Review</strong>
                  <p>2 policies due for assessment</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .overview-page {
          padding: 32px;
          max-width: 1800px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .page-title {
          font-size: 32px;
          font-weight: 900;
          margin: 0;
          color: #1a1a1a;
        }

        .page-subtitle {
          color: #718096;
          margin: 4px 0 0 0;
          font-size: 15px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .action-btn:hover {
          border-color: #cbd5e0;
          transform: translateY(-2px);
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .metric-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.3s;
        }

        .metric-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .metric-card.highlight {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .metric-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .metric-icon {
          font-size: 24px;
        }

        .metric-label {
          font-size: 13px;
          font-weight: 600;
          opacity: 0.8;
        }

        .metric-value {
          font-size: 36px;
          font-weight: 900;
          font-family: 'Space Mono', monospace;
          margin-bottom: 4px;
        }

        .metric-detail {
          font-size: 13px;
          opacity: 0.7;
        }

        .metric-card.highlight .metric-label,
        .metric-card.highlight .metric-detail {
          opacity: 0.9;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 24px;
        }

        .section-card,
        .status-card,
        .actions-card,
        .alerts-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section-header h2 {
          font-size: 20px;
          font-weight: 800;
          margin: 0;
          color: #1a1a1a;
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: #00E400;
          color: white;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .side-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .card-title {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 16px 0;
          color: #1a1a1a;
        }

        .status-aqi {
          text-align: center;
          padding: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .aqi-number {
          display: block;
          font-size: 48px;
          font-weight: 900;
          font-family: 'Space Mono', monospace;
        }

        .aqi-label {
          font-size: 14px;
          opacity: 0.9;
        }

        .distribution-chart {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .dist-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .dist-bar {
          height: 24px;
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .dist-bar.good { background: #00E400; }
        .dist-bar.moderate { background: #FF7E00; }
        .dist-bar.poor { background: #FF0000; }

        .dist-label {
          font-size: 12px;
          color: #718096;
          font-weight: 600;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .quick-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px;
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 600;
          font-size: 13px;
        }

        .quick-btn:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
          transform: translateY(-2px);
        }

        .quick-btn span {
          font-size: 24px;
        }

        .alert-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .alert-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          border-left: 4px solid;
        }

        .alert-item.critical {
          background: rgba(255, 0, 0, 0.05);
          border-left-color: #FF0000;
        }

        .alert-item.warning {
          background: rgba(255, 126, 0, 0.05);
          border-left-color: #FF7E00;
        }

        .alert-icon {
          font-size: 20px;
        }

        .alert-content strong {
          display: block;
          font-size: 14px;
          margin-bottom: 4px;
          color: #1a1a1a;
        }

        .alert-content p {
          margin: 0;
          font-size: 13px;
          color: #718096;
        }

        .no-data {
          text-align: center;
          color: #a0aec0;
          padding: 20px;
        }

        @media (max-width: 1200px) {
          .content-grid {
            grid-template-columns: 1fr;
          }

          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .overview-page {
            padding: 16px;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Overview;