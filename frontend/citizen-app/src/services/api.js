import axios from 'axios';

// Base API URL - update this with your backend URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Handle specific error codes
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          console.error('Access forbidden');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error('API error:', error.response.data);
      }
    } else if (error.request) {
      console.error('Network error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Auth API calls
const authAPI = {
  login: (credentials) => api.post('/auth/token', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (passwords) => api.post('/auth/change-password', passwords),
};

// AQI API calls
const aqiAPI = {
  getCurrent: (params) => api.get('/aqi/current', { params }),
  getHistorical: (params) => api.get('/aqi/historical', { params }),
  getStations: () => api.get('/aqi/stations'),
  getHeatmap: () => api.get('/aqi/heatmap'),
  getStationById: (stationId) => api.get(`/aqi/${stationId}`),
};

// Forecast API calls
const forecastAPI = {
  getHourly: (params) => api.get('/forecast/hourly', { params }),
  getDaily: (params) => api.get('/forecast/daily', { params }),
  getMap: (params) => api.get('/forecast/map', { params }),
  getComparison: (stationId) => api.get(`/forecast/comparison/${stationId}`),
};

// Source Attribution API calls
const sourceAPI = {
  getBreakdown: (params) => api.get('/source/breakdown', { params }),
  getTemporal: (params) => api.get('/source/temporal', { params }),
  getRegionalComparison: (params) => api.get('/source/regional-comparison', { params }),
  getHotspots: (params) => api.get('/source/hotspots', { params }),
  getTimeSeries: (params) => api.get('/source/time-series', { params }),
};

// Route API calls
const routeAPI = {
  getSafeRoute: (params) => api.get('/route/safe-route', { params }),
  getRouteAQI: (params) => api.get('/route/route-aqi', { params }),
  getAreaAQI: (params) => api.get('/route/area-aqi', { params }),
  getOutdoorActivity: (params) => api.get('/route/outdoor-activity', { params }),
  compareRoutes: (params) => api.get('/route/compare-routes', { params }),
};

// Alert API calls
const alertAPI = {
  getMyAlerts: () => api.get('/alerts/me'),
  markAsRead: (alertId) => api.put(`/alerts/${alertId}/read`),
  markAsDismissed: (alertId) => api.put(`/alerts/${alertId}/dismiss`),
  getPreferences: () => api.get('/alerts/preferences'),
  updatePreferences: (preferences) => api.put('/alerts/preferences', preferences),
};

// Policy API calls (for policy makers)
const policyAPI = {
  getRecommendations: (params) => api.get('/policy/recommendations', { params }),
  simulate: (data) => api.post('/policy/simulate', data),
  getHistory: (params) => api.get('/policy/history', { params }),
  implement: (data) => api.post('/policy/implement', data),
  update: (policyId, data) => api.put(`/policy/update/${policyId}`, data),
  getEffectiveness: (params) => api.get('/policy/effectiveness', { params }),
  compare: (params) => api.get('/policy/compare', { params }),
};

// Saved Locations API calls
const locationAPI = {
  getSavedLocations: () => api.get('/locations/saved'),
  saveLocation: (data) => api.post('/locations/save', data),
  deleteLocation: (locationId) => api.delete(`/locations/${locationId}`),
  updateLocation: (locationId, data) => api.put(`/locations/${locationId}`, data),
};

// Helper functions
const helpers = {
  // Store authentication token
  setAuthToken: (token) => {
    localStorage.setItem('access_token', token);
  },

  // Get authentication token
  getAuthToken: () => {
    return localStorage.getItem('access_token');
  },

  // Remove authentication token
  removeAuthToken: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },

  // Store user data
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Get user data
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  // Format AQI category
  getAQICategory: (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Satisfactory';
    if (aqi <= 200) return 'Moderate';
    if (aqi <= 300) return 'Poor';
    if (aqi <= 400) return 'Very Poor';
    return 'Severe';
  },

  // Get AQI color
  getAQIColor: (aqi) => {
    if (aqi <= 50) return '#00E400';
    if (aqi <= 100) return '#FFFF00';
    if (aqi <= 200) return '#FF7E00';
    if (aqi <= 300) return '#FF0000';
    if (aqi <= 400) return '#8F3F97';
    return '#7E0023';
  },

  // Format date
  formatDate: (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  // Format time
  formatTime: (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // Format datetime
  formatDateTime: (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },
};

// Export everything
export {
  api,
  authAPI,
  aqiAPI,
  forecastAPI,
  sourceAPI,
  routeAPI,
  alertAPI,
  policyAPI,
  locationAPI,
  helpers,
};

export default api;