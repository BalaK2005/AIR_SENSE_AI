/**
 * AQI Forecast Component
 * Displays 72-hour air quality forecast with interactive chart
 */

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';

const AQI_COLORS = {
  'Good': '#00E400',
  'Satisfactory': '#FFFF00',
  'Moderate': '#FF7E00',
  'Poor': '#FF0000',
  'Very Poor': '#8F3F97',
  'Severe': '#7E0023'
};

const AQIForecast = ({ location }) => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedHour, setSelectedHour] = useState(null);
  const [viewMode, setViewMode] = useState('24'); // 24h, 48h, 72h

  useEffect(() => {
    if (location) {
      fetchForecast();
    }
  }, [location]);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/forecast`, {
        params: {
          latitude: location.lat,
          longitude: location.lon,
          hours: 72
        }
      });
      
      setForecast(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching forecast:', error);
      setLoading(false);
    }
  };

  const formatChartData = () => {
    if (!forecast) return [];
    
    const hours = viewMode === '24' ? 24 : viewMode === '48' ? 48 : 72;
    
    return forecast.forecast_hours.slice(0, hours).map((hour, index) => ({
      time: new Date(hour.timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        hour12: false 
      }),
      fullDate: new Date(hour.timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      aqi: hour.aqi,
      category: hour.category,
      confidence: hour.confidence,
      color: AQI_COLORS[hour.category]
    }));
  };

  const getAQIRange = (aqi) => {
    if (aqi <= 50) return { min: 0, max: 50, label: 'Good' };
    if (aqi <= 100) return { min: 51, max: 100, label: 'Satisfactory' };
    if (aqi <= 200) return { min: 101, max: 200, label: 'Moderate' };
    if (aqi <= 300) return { min: 201, max: 300, label: 'Poor' };
    if (aqi <= 400) return { min: 301, max: 400, label: 'Very Poor' };
    return { min: 401, max: 500, label: 'Severe' };
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border-2" style={{ borderColor: data.color }}>
          <p className="font-bold text-lg mb-1">AQI: {data.aqi}</p>
          <p className="text-sm font-semibold mb-2" style={{ color: data.color }}>
            {data.category}
          </p>
          <p className="text-xs text-gray-600 mb-1">{data.fullDate}</p>
          <p className="text-xs text-gray-500">Confidence: {data.confidence}%</p>
        </div>
      );
    }
    return null;
  };

  const getForecastSummary = () => {
    if (!forecast) return null;
    
    const hours24 = forecast.forecast_hours.slice(0, 24);
    const avgAQI = Math.round(hours24.reduce((sum, h) => sum + h.aqi, 0) / hours24.length);
    const maxAQI = Math.max(...hours24.map(h => h.aqi));
    const minAQI = Math.min(...hours24.map(h => h.aqi));
    
    // Find worst period
    const worstHour = hours24.reduce((worst, current) => 
      current.aqi > worst.aqi ? current : worst
    );
    
    return { avgAQI, maxAQI, minAQI, worstHour };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading forecast...</p>
        </div>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="text-center py-8 text-gray-500">
        No forecast data available
      </div>
    );
  }

  const chartData = formatChartData();
  const summary = getForecastSummary();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Air Quality Forecast</h2>
          <p className="text-sm text-gray-500 mt-1">
            Updated {new Date(forecast.generated_at).toLocaleString()}
          </p>
        </div>
        
        {/* View Mode Selector */}
        <div className="flex space-x-2">
          {['24', '48', '72'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {mode}h
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
          <p className="text-xs text-blue-600 font-semibold mb-1">CURRENT</p>
          <p className="text-3xl font-bold text-blue-800">{forecast.current_aqi}</p>
          <p className="text-xs text-blue-600 mt-1">AQI</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
          <p className="text-xs text-green-600 font-semibold mb-1">24H AVERAGE</p>
          <p className="text-3xl font-bold text-green-800">{summary.avgAQI}</p>
          <p className="text-xs text-green-600 mt-1">AQI</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
          <p className="text-xs text-orange-600 font-semibold mb-1">PEAK (24H)</p>
          <p className="text-3xl font-bold text-orange-800">{summary.maxAQI}</p>
          <p className="text-xs text-orange-600 mt-1">
            {new Date(summary.worstHour.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', hour12: false })}
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
          <p className="text-xs text-purple-600 font-semibold mb-1">BEST (24H)</p>
          <p className="text-3xl font-bold text-purple-800">{summary.minAQI}</p>
          <p className="text-xs text-purple-600 mt-1">AQI</p>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4A90E2" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#4A90E2" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="time" 
              stroke="#666"
              style={{ fontSize: '12px' }}
              interval={viewMode === '24' ? 2 : viewMode === '48' ? 5 : 8}
            />
            <YAxis 
              stroke="#666"
              style={{ fontSize: '12px' }}
              domain={[0, 500]}
              ticks={[0, 50, 100, 200, 300, 400, 500]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* AQI Category Bands */}
            <Area 
              type="monotone" 
              dataKey="aqi" 
              stroke="#4A90E2" 
              strokeWidth={3}
              fill="url(#aqiGradient)"
              name="AQI"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Category Reference Bands */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3">AQI Categories</h3>
        <div className="grid grid-cols-6 gap-2">
          {Object.entries(AQI_COLORS).map(([category, color]) => (
            <div key={category} className="text-center">
              <div 
                className="h-2 rounded-full mb-1" 
                style={{ backgroundColor: color }}
              ></div>
              <p className="text-xs text-gray-600">{category}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hourly Breakdown (First 12 hours) */}
      <div className="mt-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Next 12 Hours</h3>
        <div className="grid grid-cols-6 gap-3">
          {forecast.forecast_hours.slice(0, 12).map((hour, index) => (
            <div 
              key={index}
              className="bg-white border-2 rounded-lg p-3 text-center cursor-pointer hover:shadow-lg transition-shadow"
              style={{ borderColor: AQI_COLORS[hour.category] }}
              onClick={() => setSelectedHour(hour)}
            >
              <p className="text-xs text-gray-500 mb-1">
                {new Date(hour.timestamp).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  hour12: false 
                })}
              </p>
              <p 
                className="text-2xl font-bold mb-1"
                style={{ color: AQI_COLORS[hour.category] }}
              >
                {hour.aqi}
              </p>
              <p className="text-xs font-medium text-gray-600">{hour.category}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h4 className="font-bold text-blue-800 mb-2">📊 Key Insights</h4>
        <ul className="space-y-1 text-sm text-blue-900">
          <li>• Air quality expected to {summary.avgAQI > forecast.current_aqi ? 'worsen' : 'improve'} over next 24 hours</li>
          <li>• Peak pollution expected around {new Date(summary.worstHour.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</li>
          <li>• Best time for outdoor activities: early morning (6-8 AM)</li>
          <li>• {summary.maxAQI > 200 ? '⚠️ High pollution alert - limit outdoor exposure' : '✓ Moderate conditions expected'}</li>
        </ul>
      </div>
    </div>
  );
};

export default AQIForecast;