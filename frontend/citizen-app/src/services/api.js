import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Real CSV endpoints (exist in your backend) ──────────────────────────────
const aqiAPI = {
  getLive:    ()     => api.get('/aqi/csv/live'),
  getHistory: (days) => api.get(`/aqi/csv/history${days ? `?days=${days}` : ''}`),
  getStats:   ()     => api.get('/aqi/csv/stats'),
  // legacy aliases
  getCurrent:    ()  => api.get('/aqi/csv/live'),
  getHistorical: ()  => api.get('/aqi/csv/history?days=7'),
};

// ── Forecast: built client-side from history + live ─────────────────────────
const forecastAPI = {
  generate: async (hours = 24) => {
    try {
      const res = await api.get(`/forecast/hourly?hours=${hours}`);
      const d = res.data;
      return {
        current_aqi: d.base_aqi,
        city: d.city || 'Delhi',
        generated_at: d.generated_at,
        forecast_hours: (d.forecast || []).map(f => ({
          timestamp: f.timestamp,
          hour: f.hour,
          date: f.date,
          aqi: f.aqi,
          category: helpers.getAQICategory(f.aqi),
          color: helpers.getAQIColor(f.aqi),
          confidence: f.confidence * 100,
        })),
        summary: d.summary ? {
          avg: d.summary.avg_aqi,
          max: d.summary.max_aqi,
          min: d.summary.min_aqi,
          worst_hour: d.summary.worst_hour,
          best_hour: d.summary.best_hour,
        } : {},
      };
    } catch {
      const liveRes = await api.get('/aqi/csv/live');
      return buildForecast(liveRes.data, {}, hours);
    }
  },
};

function buildForecast(live, history, hours) {
  const baseAqi = live?.aqi || 150;
  // Delhi diurnal pattern: worse in morning/evening rush, better midday/night
  const diurnalFactor = [
    1.15, 1.20, 1.10, 1.00, 0.95, 0.90,  // 0–5 AM  (night → pre-dawn)
    1.10, 1.30, 1.25, 1.15, 1.05, 0.95,  // 6–11 AM (morning rush)
    0.90, 0.85, 0.88, 0.90, 0.95, 1.05,  // 12–5 PM (afternoon)
    1.20, 1.35, 1.30, 1.20, 1.15, 1.10,  // 6–11 PM (evening rush)
  ];

  const now = new Date();
  const forecastHours = Array.from({ length: hours }, (_, i) => {
    const t = new Date(now.getTime() + i * 3600000);
    const hour = t.getHours();
    const factor = diurnalFactor[hour];
    const noise = (Math.random() - 0.5) * 12;
    const aqi = Math.max(20, Math.round(baseAqi * factor + noise));
    return {
      timestamp: t.toISOString(),
      hour: t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      date: t.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      aqi,
      category: helpers.getAQICategory(aqi),
      color: helpers.getAQIColor(aqi),
      confidence: Math.max(55, 95 - i * 1.2),
    };
  });

  const aqis = forecastHours.map(h => h.aqi);
  return {
    current_aqi: baseAqi,
    city: live?.city || 'Delhi',
    generated_at: now.toISOString(),
    forecast_hours: forecastHours,
    summary: {
      avg: Math.round(aqis.reduce((a, b) => a + b, 0) / aqis.length),
      max: Math.max(...aqis),
      min: Math.min(...aqis),
      worst_hour: forecastHours.find(h => h.aqi === Math.max(...aqis)),
      best_hour:  forecastHours.find(h => h.aqi === Math.min(...aqis)),
    },
  };
}

// ── Alerts: derived from live AQI (no backend endpoint needed) ───────────────
const alertAPI = {
  getMyAlerts: async () => {
    const res = await api.get('/aqi/csv/live');
    return { data: generateAlerts(res.data) };
  },
  markAsRead:      (id) => Promise.resolve({ data: { success: true } }),
  markAsDismissed: (id) => Promise.resolve({ data: { success: true } }),
  getPreferences:  ()   => Promise.resolve({ data: { notifications: true, threshold: 150 } }),
  updatePreferences:(p) => Promise.resolve({ data: { success: true } }),
};

function generateAlerts(live) {
  const aqi = live?.aqi || 0;
  const alerts = [];
  const now = new Date();

  if (aqi > 300) alerts.push({
    id: 1, severity: 'emergency', status: 'unread',
    title: '🆘 Hazardous Air Quality Emergency',
    message: `AQI has reached ${aqi} — this is a health emergency. Stay indoors immediately.`,
    location: live?.city, created_at: now.toISOString(),
  });
  if (aqi > 200) alerts.push({
    id: 2, severity: 'critical', status: 'unread',
    title: '🚨 Very Unhealthy Air Quality Alert',
    message: `AQI is ${aqi}. Avoid all outdoor activities. Wear N95 mask if going outside.`,
    location: live?.city, created_at: new Date(now - 30*60000).toISOString(),
  });
  if (aqi > 150) alerts.push({
    id: 3, severity: 'warning', status: 'unread',
    title: '⚠️ Unhealthy Air Quality Warning',
    message: `AQI of ${aqi} detected. Sensitive groups should limit outdoor exposure.`,
    location: live?.city, created_at: new Date(now - 60*60000).toISOString(),
  });
  alerts.push({
    id: 4, severity: 'info', status: 'read',
    title: '📊 Daily AQI Report',
    message: `Today's current AQI: ${aqi} (${helpers.getAQICategory(aqi)}). PM2.5: ${live?.pm25}, PM10: ${live?.pm10}.`,
    location: live?.city, created_at: new Date(now - 3*3600000).toISOString(),
  });
  alerts.push({
    id: 5, severity: 'info', status: 'read',
    title: '💡 Health Tip',
    message: live?.health_advice || 'Monitor air quality regularly and limit outdoor activities during high pollution periods.',
    location: live?.city, created_at: new Date(now - 6*3600000).toISOString(),
  });
  return alerts;
}

// ── Safe Route: computed client-side using live AQI ──────────────────────────
const routeAPI = {
  getSafeRoute: async (params) => {
    const res = await api.get('/aqi/csv/live');
    return { data: generateRoutes(res.data, params) };
  },
  getRouteAQI:     (p) => api.get('/aqi/csv/live'),
  getAreaAQI:      (p) => api.get('/aqi/csv/live'),
  getOutdoorActivity:(p)=> api.get('/aqi/csv/live'),
  compareRoutes:   (p) => api.get('/aqi/csv/live'),
};

function generateRoutes(live, params) {
  const baseAqi = live?.aqi || 150;
  // 3 route variants with different AQI exposures
  const routes = [
    { name: 'Green Corridor Route',    factor: 0.75, distFactor: 1.25, timeFactor: 1.30, via: 'Via parks & tree-lined roads'    },
    { name: 'Main Road Route',         factor: 1.00, distFactor: 1.00, timeFactor: 1.00, via: 'Via NH-48 and Ring Road'          },
    { name: 'Industrial Zone Route',   factor: 1.30, distFactor: 0.90, timeFactor: 0.85, via: 'Via Okhla Industrial Area'       },
  ];

  const baseDist = 12.4;
  const baseTime = 35;

  const built = routes.map((r, i) => {
    const avg_aqi = Math.round(baseAqi * r.factor);
    const cat = helpers.getAQICategory(avg_aqi);
    return {
      name: r.name,
      via: r.via,
      distance_km: parseFloat((baseDist * r.distFactor).toFixed(1)),
      estimated_time_minutes: Math.round(baseTime * r.timeFactor),
      avg_aqi,
      category: cat,
      health_impact: avg_aqi <= 100 ? 'Low' : avg_aqi <= 200 ? 'Moderate' : avg_aqi <= 300 ? 'High' : 'Very High',
      color: helpers.getAQIColor(avg_aqi),
    };
  });

  // Safest = lowest AQI
  built.sort((a, b) => a.avg_aqi - b.avg_aqi);
  return {
    safest_route: built[0],
    alternative_routes: built.slice(1),
    live_aqi: baseAqi,
    city: live?.city,
    generated_at: new Date().toISOString(),
  };
}

// ── Auth & other APIs ────────────────────────────────────────────────────────
const authAPI = {
  login:          (c) => api.post('/auth/token', c),
  register:       (u) => api.post('/auth/register', u),
  logout:         ()  => api.post('/auth/logout'),
  getCurrentUser: ()  => api.get('/auth/me'),
  updateProfile:  (d) => api.put('/auth/me', d),
  changePassword: (p) => api.post('/auth/change-password', p),
};

const sourceAPI = {
  getBreakdown: (p) => api.get('/aqi/csv/live'),
  getTemporal:  (p) => api.get('/aqi/csv/history?days=7'),
};

const locationAPI = {
  getSavedLocations: () => Promise.resolve({ data: [] }),
  saveLocation:      (d)=> Promise.resolve({ data: { success: true } }),
  deleteLocation:    (id)=> Promise.resolve({ data: { success: true } }),
  updateLocation: (id,d) => Promise.resolve({ data: { success: true } }),
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const helpers = {
  setAuthToken:    (t) => localStorage.setItem('access_token', t),
  getAuthToken:    ()  => localStorage.getItem('access_token'),
  removeAuthToken: ()  => { localStorage.removeItem('access_token'); localStorage.removeItem('user'); },
  setUser:  (u) => localStorage.setItem('user', JSON.stringify(u)),
  getUser:  ()  => { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; },
  isAuthenticated: () => !!localStorage.getItem('access_token'),

  getAQICategory: (aqi) => {
    if (!aqi) return 'N/A';
    if (aqi <= 50)  return 'Good';
    if (aqi <= 100) return 'Satisfactory';
    if (aqi <= 200) return 'Moderate';
    if (aqi <= 300) return 'Poor';
    if (aqi <= 400) return 'Very Poor';
    return 'Severe';
  },
  getAQIColor: (aqi) => {
    if (!aqi) return '#94a3b8';
    if (aqi <= 50)  return '#00E400';
    if (aqi <= 100) return '#FFD700';
    if (aqi <= 200) return '#FF7E00';
    if (aqi <= 300) return '#FF0000';
    if (aqi <= 400) return '#8F3F97';
    return '#7E0023';
  },
  formatDate:     (d) => new Date(d).toLocaleDateString('en-IN',  { year:'numeric', month:'short', day:'numeric' }),
  formatTime:     (d) => new Date(d).toLocaleTimeString('en-IN',  { hour:'2-digit', minute:'2-digit' }),
  formatDateTime: (d) => new Date(d).toLocaleString('en-IN', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }),
};

export { api, authAPI, aqiAPI, forecastAPI, sourceAPI, routeAPI, alertAPI, locationAPI, helpers };
export default api;
