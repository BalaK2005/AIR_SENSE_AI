import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { api } from '../services/api';

const AQIForecast = ({ stationId }) => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(24);

  useEffect(() => {
    if (stationId) {
      fetchForecast();
    }
  }, [stationId, hours]);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/forecast/hourly`, {
        params: { station_id: stationId, hours }
      });
      setForecast(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching forecast:', error);
      setLoading(false);
    }
  };

  const getAQICategory = (aqi) => {
    if (aqi <= 50) return { category: 'Good', color: '#00E400' };
    if (aqi <= 100) return { category: 'Satisfactory', color: '#FFFF00' };
    if (aqi <= 200) return { category: 'Moderate', color: '#FF7E00' };
    if (aqi <= 300) return { category: 'Poor', color: '#FF0000' };
    if (aqi <= 400) return { category: 'Very Poor', color: '#8F3F97' };
    return { category: 'Severe', color: '#7E0023' };
  };

  if (loading) return <div>Loading forecast...</div>;
  if (!forecast || forecast.length === 0) return <div>No forecast available</div>;

  const chartData = forecast.map(item => ({
    time: new Date(item.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
    aqi: item.aqi,
    category: item.category
  }));

  return (
    <div className="forecast-container">
      <div className="forecast-header">
        <h2>Air Quality Forecast</h2>
        <div className="time-selector">
          {[24, 48, 72].map(h => (
            <button key={h} className={hours === h ? 'active' : ''} onClick={() => setHours(h)}>
              {h}h
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis label={{ value: 'AQI', angle: -90 }} />
          <Tooltip />
          <Area type="monotone" dataKey="aqi" stroke="#667eea" fill="#667eea" fillOpacity={0.3} />
        </AreaChart>
      </ResponsiveContainer>

      <div className="forecast-summary">
        <div className="summary-card">
          <span>📊 Avg:</span>
          <strong>{Math.round(forecast.reduce((acc, item) => acc + item.aqi, 0) / forecast.length)}</strong>
        </div>
        <div className="summary-card">
          <span>📈 Peak:</span>
          <strong>{Math.round(Math.max(...forecast.map(item => item.aqi)))}</strong>
        </div>
        <div className="summary-card">
          <span>📉 Best:</span>
          <strong>{Math.round(Math.min(...forecast.map(item => item.aqi)))}</strong>
        </div>
      </div>
    </div>
  );
};

export default AQIForecast;
