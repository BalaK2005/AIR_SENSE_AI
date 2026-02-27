import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const aqiService = {
  getCurrentAQI: async (lat, lon) => {
    const response = await axios.get(`${API_BASE_URL}/aqi/current`, {
      params: { latitude: lat, longitude: lon }
    });
    return response.data;
  },
  
  getForecast: async (lat, lon, hours = 72) => {
    const response = await axios.get(`${API_BASE_URL}/forecast`, {
      params: { latitude: lat, longitude: lon, hours }
    });
    return response.data;
  }
};