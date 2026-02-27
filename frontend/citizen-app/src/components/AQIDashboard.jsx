import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import AQIMap from './AQIMap';
import AQIForecast from './AQIForecast';

const API_BASE = 'http://localhost:8000/api/v1';

const AQIDashboard = () => {
  const [currentAQI, setCurrentAQI] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated data (replace with actual API call later)
    fetchAQIData();
  }, []);

const fetchAQIData = async () => {
  try {
    const response = await axios.get(`${API_BASE}/aqi/current`, {
      params: { latitude: 28.6139, longitude: 77.2090, area_name: 'Delhi' }
    });
    
    const data = response.data;
    setCurrentAQI({
      aqi: data.aqi,
      city: data.location.area_name || 'Delhi',
      pm25: data.pm25,
      pm10: data.pm10,
      no2: data.no2,
      o3: data.o3,
      so2: data.so2,
      co: data.co,
      temp: 24,
      humidity: 35,
      timestamp: new Date(data.timestamp).toLocaleString(),
      category: data.category,
      health_impact: data.health_impact,
      recommendations: data.recommendations
    });
    setLoading(false);
  } catch (error) {
    console.error('Error fetching data:', error);
    setFallbackData();
    setLoading(false);
  }
};

const setFallbackData = () => {
  setCurrentAQI({
    aqi: 179,
    city: 'Delhi',
    pm25: 179,
    pm10: 135,
    no2: 13,
    o3: 56,
    temp: 24.1,
    humidity: 35,
    timestamp: new Date().toLocaleString()
  });
};

  const getAQILevel = (aqi) => {
    if (aqi <= 50) return { level: 'Good', color: 'bg-green-500', emoji: '🟢' };
    if (aqi <= 100) return { level: 'Moderate', color: 'bg-yellow-500', emoji: '🟡' };
    if (aqi <= 200) return { level: 'Unhealthy', color: 'bg-orange-500', emoji: '🟠' };
    if (aqi <= 300) return { level: 'Very Unhealthy', color: 'bg-red-500', emoji: '🔴' };
    return { level: 'Hazardous', color: 'bg-purple-900', emoji: '⚫' };
  };

  const getHealthAdvice = (aqi) => {
    if (aqi <= 50) return 'Air quality is good. Enjoy outdoor activities!';
    if (aqi <= 100) return 'Acceptable. Sensitive people should limit prolonged outdoor activity.';
    if (aqi <= 200) return 'Wear a mask outdoors. Use air purifiers indoors.';
    if (aqi <= 300) return 'Avoid outdoor activities. Keep windows closed.';
    return 'Stay indoors! Health alert!';
  };

  // Sample forecast data
  const forecastData = [
    { hour: 'Now', aqi: 179 },
    { hour: '+3h', aqi: 175 },
    { hour: '+6h', aqi: 168 },
    { hour: '+9h', aqi: 162 },
    { hour: '+12h', aqi: 155 },
    { hour: '+15h', aqi: 148 },
    { hour: '+18h', aqi: 142 },
    { hour: '+21h', aqi: 138 },
    { hour: '+24h', aqi: 135 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-2xl font-bold text-gray-700">Loading AirSense AI... 🌍</div>
      </div>
    );
  }

  const aqiInfo = getAQILevel(currentAQI.aqi);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-4xl font-bold">AirSense AI 🌍</h1>
          <p className="text-blue-100 mt-1">Real-time Air Quality Monitoring for Delhi-NCR</p>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Current AQI Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Current Air Quality</h2>
              <p className="text-gray-500 mt-1">📍 {currentAQI.city}</p>
              <p className="text-sm text-gray-400">🕐 {currentAQI.timestamp}</p>
            </div>
            <div className="text-right">
              <div className={`inline-block px-6 py-3 rounded-full ${aqiInfo.color} text-white font-bold text-lg`}>
                {aqiInfo.emoji} {aqiInfo.level}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* AQI Number */}
            <div className="text-center">
              <div className="text-8xl font-bold text-gray-800">{currentAQI.aqi}</div>
              <div className="text-2xl text-gray-600 mt-2">Air Quality Index</div>
            </div>

            {/* Health Advice */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3">💡 Health Advice</h3>
              <p className="text-gray-700 text-lg">{getHealthAdvice(currentAQI.aqi)}</p>
            </div>
          </div>
        </div>

        {/* Pollutant Details */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-gray-500 text-sm font-semibold">PM2.5</div>
            <div className="text-3xl font-bold text-gray-800 mt-2">{currentAQI.pm25}</div>
            <div className="text-xs text-gray-400 mt-1">μg/m³</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-gray-500 text-sm font-semibold">PM10</div>
            <div className="text-3xl font-bold text-gray-800 mt-2">{currentAQI.pm10}</div>
            <div className="text-xs text-gray-400 mt-1">μg/m³</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-gray-500 text-sm font-semibold">NO₂</div>
            <div className="text-3xl font-bold text-gray-800 mt-2">{currentAQI.no2}</div>
            <div className="text-xs text-gray-400 mt-1">ppb</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-gray-500 text-sm font-semibold">O₃</div>
            <div className="text-3xl font-bold text-gray-800 mt-2">{currentAQI.o3}</div>
            <div className="text-xs text-gray-400 mt-1">ppb</div>
          </div>
        </div>

        {/* Weather Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🌡️ Temperature</h3>
            <div className="text-4xl font-bold text-gray-800">{currentAQI.temp}°C</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">💧 Humidity</h3>
            <div className="text-4xl font-bold text-gray-800">{currentAQI.humidity}%</div>
          </div>
        </div>

        {/* Forecast Chart */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">📈 24-Hour AQI Forecast</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="aqi" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Forecast Section */}
      <div className="container mx-auto px-6 py-8">
        <AQIForecast location={{ lat: 28.6139, lon: 77.2090 }} />
      </div>

      {/* Map View */}
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8" style={{ height: '600px' }}>
          <h2 className="text-3xl font-bold text-gray-800 mb-6">🗺️ AQI Map - Delhi NCR</h2>
          <AQIMap userLocation={{ lat: 28.6139, lon: 77.2090 }} />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center py-6 mt-12">
        <p>AirSense AI 🌍 | AI-Powered Air Quality Monitoring</p>
        <p className="text-sm text-gray-400 mt-2">Built with React, Python & Machine Learning</p>
      </footer>
    </div>
  );
};

export default AQIDashboard;
