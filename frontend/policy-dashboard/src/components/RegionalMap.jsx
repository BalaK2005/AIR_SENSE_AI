import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polygon, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 10);
    }
  }, [center, zoom, map]);
  return null;
}

const RegionalMap = ({ selectedRegion, onRegionSelect }) => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter] = useState([28.6139, 77.2090]);
  const [zoom] = useState(10);
  const [viewMode, setViewMode] = useState('stations'); // stations, heatmap, forecast

  // Delhi-NCR regions with boundaries
  const regions = {
    Delhi: {
      name: 'Delhi',
      bounds: [[28.40, 76.85], [28.88, 76.85], [28.88, 77.35], [28.40, 77.35]],
      center: [28.7041, 77.1025],
      color: '#667eea'
    },
    Noida: {
      name: 'Noida',
      bounds: [[28.45, 77.28], [28.65, 77.28], [28.65, 77.50], [28.45, 77.50]],
      center: [28.5355, 77.3910],
      color: '#f093fb'
    },
    Gurgaon: {
      name: 'Gurgaon',
      bounds: [[28.35, 76.90], [28.55, 76.90], [28.55, 77.15], [28.35, 77.15]],
      center: [28.4595, 77.0266],
      color: '#4facfe'
    },
    Ghaziabad: {
      name: 'Ghaziabad',
      bounds: [[28.58, 77.35], [28.75, 77.35], [28.75, 77.55], [28.58, 77.55]],
      center: [28.6692, 77.4538],
      color: '#43e97b'
    },
    Faridabad: {
      name: 'Faridabad',
      bounds: [[28.30, 77.20], [28.50, 77.20], [28.50, 77.45], [28.30, 77.45]],
      center: [28.4089, 77.3178],
      color: '#fa709a'
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const response = await api.get('/aqi/current');
      setStations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stations:', error);
      setLoading(false);
    }
  };

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#00E400';
    if (aqi <= 100) return '#FFFF00';
    if (aqi <= 200) return '#FF7E00';
    if (aqi <= 300) return '#FF0000';
    if (aqi <= 400) return '#8F3F97';
    return '#7E0023';
  };

  const getRegionStats = (regionName) => {
    const regionStations = stations.filter(s => 
      s.city?.toLowerCase().includes(regionName.toLowerCase()) ||
      s.station_name?.toLowerCase().includes(regionName.toLowerCase())
    );

    if (regionStations.length === 0) return null;

    const avgAQI = regionStations.reduce((sum, s) => sum + s.aqi, 0) / regionStations.length;
    const maxAQI = Math.max(...regionStations.map(s => s.aqi));
    const minAQI = Math.min(...regionStations.map(s => s.aqi));

    return {
      avgAQI: Math.round(avgAQI),
      maxAQI: Math.round(maxAQI),
      minAQI: Math.round(minAQI),
      stationCount: regionStations.length
    };
  };

  if (loading) {
    return <div className="map-loading">Loading regional data...</div>;
  }

  return (
    <div className="regional-map-container">
      {/* Controls */}
      <div className="map-controls">
        <div className="view-mode-selector">
          <button 
            className={`mode-btn ${viewMode === 'stations' ? 'active' : ''}`}
            onClick={() => setViewMode('stations')}
          >
            <span>📍</span> Stations
          </button>
          <button 
            className={`mode-btn ${viewMode === 'heatmap' ? 'active' : ''}`}
            onClick={() => setViewMode('heatmap')}
          >
            <span>🔥</span> Heatmap
          </button>
          <button 
            className={`mode-btn ${viewMode === 'forecast' ? 'active' : ''}`}
            onClick={() => setViewMode('forecast')}
          >
            <span>🔮</span> Forecast
          </button>
        </div>

        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-label">Total Stations</span>
            <span className="stat-value">{stations.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">NCR Average</span>
            <span className="stat-value">
              {Math.round(stations.reduce((sum, s) => sum + s.aqi, 0) / stations.length)}
            </span>
          </div>
        </div>
      </div>

      {/* Regional Cards */}
      <div className="regions-grid">
        {Object.entries(regions).map(([key, region]) => {
          const stats = getRegionStats(region.name);
          const isSelected = selectedRegion === region.name;

          return (
            <div 
              key={key}
              className={`region-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onRegionSelect && onRegionSelect(region.name)}
              style={{ borderLeft: `4px solid ${region.color}` }}
            >
              <div className="region-header">
                <h3>{region.name}</h3>
                {stats && (
                  <span className="region-stations">{stats.stationCount} stations</span>
                )}
              </div>
              
              {stats ? (
                <div className="region-stats">
                  <div className="stat">
                    <span className="stat-label">Avg</span>
                    <span className="stat-number" style={{ color: getAQIColor(stats.avgAQI) }}>
                      {stats.avgAQI}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Max</span>
                    <span className="stat-number">{stats.maxAQI}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Min</span>
                    <span className="stat-number">{stats.minAQI}</span>
                  </div>
                </div>
              ) : (
                <p className="no-data">No data available</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Map */}
      <div className="map-wrapper">
        <MapContainer center={mapCenter} zoom={zoom} className="leaflet-map">
          <MapController center={mapCenter} zoom={zoom} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Region Boundaries */}
          {Object.entries(regions).map(([key, region]) => (
            <Polygon
              key={key}
              positions={region.bounds}
              pathOptions={{
                color: region.color,
                fillColor: region.color,
                fillOpacity: selectedRegion === region.name ? 0.2 : 0.05,
                weight: selectedRegion === region.name ? 3 : 1
              }}
            />
          ))}

          {/* Station Markers */}
          {viewMode === 'stations' && stations.map((station) => (
            <CircleMarker
              key={station.station_id}
              center={[station.latitude, station.longitude]}
              radius={8}
              pathOptions={{
                fillColor: getAQIColor(station.aqi),
                fillOpacity: 0.9,
                color: '#ffffff',
                weight: 2
              }}
            >
              <Popup>
                <div className="station-popup">
                  <h4>{station.station_name}</h4>
                  <div className="popup-aqi">
                    <span style={{ color: getAQIColor(station.aqi) }}>
                      AQI: {Math.round(station.aqi)}
                    </span>
                  </div>
                  {station.pm25 && <p>PM2.5: {station.pm25.toFixed(1)} µg/m³</p>}
                  {station.pm10 && <p>PM10: {station.pm10.toFixed(1)} µg/m³</p>}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <style jsx>{`
        .regional-map-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .map-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .view-mode-selector {
          display: flex;
          gap: 8px;
          background: #f7fafc;
          padding: 4px;
          border-radius: 12px;
        }

        .mode-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: transparent;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          color: #4a5568;
        }

        .mode-btn:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        .mode-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .stats-summary {
          display: flex;
          gap: 24px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: #718096;
          font-weight: 600;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 800;
          color: #1a1a1a;
          font-family: 'Space Mono', monospace;
        }

        .regions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .region-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .region-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
        }

        .region-card.selected {
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
        }

        .region-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .region-header h3 {
          font-size: 16px;
          font-weight: 700;
          margin: 0;
          color: #1a1a1a;
        }

        .region-stations {
          font-size: 11px;
          color: #718096;
          font-weight: 600;
        }

        .region-stats {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .stat .stat-label {
          font-size: 11px;
          color: #a0aec0;
        }

        .stat-number {
          font-size: 20px;
          font-weight: 800;
          font-family: 'Space Mono', monospace;
        }

        .no-data {
          color: #a0aec0;
          font-size: 13px;
          margin: 0;
        }

        .map-wrapper {
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .leaflet-map {
          height: 600px;
          width: 100%;
        }

        .station-popup h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 700;
        }

        .popup-aqi {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .station-popup p {
          margin: 4px 0;
          font-size: 12px;
          color: #4a5568;
        }

        .map-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          color: #718096;
        }

        @media (max-width: 768px) {
          .regions-grid {
            grid-template-columns: 1fr;
          }

          .stats-summary {
            flex-direction: column;
            gap: 8px;
          }

          .leaflet-map {
            height: 400px;
          }
        }
      `}</style>
    </div>
  );
};

export default RegionalMap;