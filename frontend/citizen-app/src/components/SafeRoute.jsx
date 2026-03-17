import React, { useState, useEffect } from 'react';
import { aqiAPI, helpers } from '../services/api';

// Delhi-NCR known locations with coordinates
const KNOWN_LOCATIONS = {
  'connaught place':    { lat:28.6315, lon:77.2167, name:'Connaught Place' },
  'india gate':         { lat:28.6129, lon:77.2295, name:'India Gate' },
  'anand vihar':        { lat:28.6469, lon:77.3160, name:'Anand Vihar' },
  'bawana':             { lat:28.7936, lon:77.0380, name:'Bawana' },
  'mundka':             { lat:28.6808, lon:77.0291, name:'Mundka' },
  'jahangirpuri':       { lat:28.7283, lon:77.1637, name:'Jahangirpuri' },
  'rohini':             { lat:28.7495, lon:77.0674, name:'Rohini' },
  'dwarka':             { lat:28.5921, lon:77.0460, name:'Dwarka' },
  'noida':              { lat:28.5355, lon:77.3910, name:'Noida' },
  'gurgaon':            { lat:28.4595, lon:77.0266, name:'Gurgaon' },
  'faridabad':          { lat:28.4089, lon:77.3178, name:'Faridabad' },
  'ghaziabad':          { lat:28.6692, lon:77.4538, name:'Ghaziabad' },
  'okhla':              { lat:28.5314, lon:77.2735, name:'Okhla' },
  'lajpat nagar':       { lat:28.5700, lon:77.2430, name:'Lajpat Nagar' },
  'saket':              { lat:28.5244, lon:77.2066, name:'Saket' },
  'hauz khas':          { lat:28.5494, lon:77.2001, name:'Hauz Khas' },
  'vasant kunj':        { lat:28.5206, lon:77.1577, name:'Vasant Kunj' },
  'janakpuri':          { lat:28.6289, lon:77.0836, name:'Janakpuri' },
  'rajouri garden':     { lat:28.6490, lon:77.1200, name:'Rajouri Garden' },
  'karol bagh':         { lat:28.6514, lon:77.1908, name:'Karol Bagh' },
  'paharganj':          { lat:28.6448, lon:77.2167, name:'Paharganj' },
  'chandni chowk':      { lat:28.6505, lon:77.2303, name:'Chandni Chowk' },
  'laxmi nagar':        { lat:28.6310, lon:77.2763, name:'Laxmi Nagar' },
  'preet vihar':        { lat:28.6447, lon:77.2966, name:'Preet Vihar' },
  'punjabi bagh':       { lat:28.6720, lon:77.1310, name:'Punjabi Bagh' },
  'pitampura':          { lat:28.7011, lon:77.1312, name:'Pitampura' },
  'ito':                { lat:28.6289, lon:77.2401, name:'ITO' },
  'nehru place':        { lat:28.5488, lon:77.2520, name:'Nehru Place' },
  'greater kailash':    { lat:28.5413, lon:77.2376, name:'Greater Kailash' },
  'south extension':    { lat:28.5676, lon:77.2193, name:'South Extension' },
  'sector 62 noida':    { lat:28.6209, lon:77.3687, name:'Sector 62, Noida' },
};

// AQI hotspot zones in Delhi-NCR (higher = more polluted)
const AQI_ZONES = [
  { name:'Anand Vihar',   lat:28.6469, lon:77.3160, aqi_factor:1.4 },
  { name:'Bawana',        lat:28.7936, lon:77.0380, aqi_factor:1.5 },
  { name:'Mundka',        lat:28.6808, lon:77.0291, aqi_factor:1.45 },
  { name:'Jahangirpuri',  lat:28.7283, lon:77.1637, aqi_factor:1.35 },
  { name:'Okhla',         lat:28.5314, lon:77.2735, aqi_factor:1.3 },
  { name:'Narela',        lat:28.8524, lon:77.0947, aqi_factor:1.5 },
  { name:'Rohini',        lat:28.7495, lon:77.0674, aqi_factor:1.2 },
  { name:'ITO',           lat:28.6289, lon:77.2401, aqi_factor:1.25 },
  { name:'Connaught Place',lat:28.6315,lon:77.2167, aqi_factor:1.1 },
  { name:'Hauz Khas',     lat:28.5494, lon:77.2001, aqi_factor:0.85 },
  { name:'Vasant Kunj',   lat:28.5206, lon:77.1577, aqi_factor:0.80 },
  { name:'Saket',         lat:28.5244, lon:77.2066, aqi_factor:0.88 },
];

// Green zones (parks, tree-lined areas) — lower AQI
const GREEN_ZONES = [
  { lat:28.5528, lon:77.2197 }, // Lodhi Garden
  { lat:28.6236, lon:77.1974 }, // Central Ridge
  { lat:28.5494, lon:77.2001 }, // Hauz Khas
  { lat:28.6061, lon:77.1686 }, // Sanjay Van
];

function parseLocation(input) {
  const trimmed = input.trim().toLowerCase();
  // Check known locations
  for (const [key, val] of Object.entries(KNOWN_LOCATIONS)) {
    if (trimmed.includes(key) || key.includes(trimmed)) return val;
  }
  // Try lat,lon format
  const coords = trimmed.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
  if (coords) return { lat: parseFloat(coords[1]), lon: parseFloat(coords[2]), name: input };
  // Default to center Delhi
  return { lat:28.6139, lon:77.2090, name: input };
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2-lat1) * Math.PI/180;
  const dLon = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function getZoneAqiFactor(lat, lon) {
  let minDist = Infinity, factor = 1.0;
  for (const z of AQI_ZONES) {
    const d = haversineKm(lat, lon, z.lat, z.lon);
    if (d < minDist) { minDist = d; factor = z.aqi_factor; }
  }
  return minDist < 5 ? factor : 1.0;
}

function nearGreenZone(lat, lon) {
  return GREEN_ZONES.some(g => haversineKm(lat, lon, g.lat, g.lon) < 3);
}

function getMidpoint(lat1, lon1, lat2, lon2, fraction=0.5) {
  return { lat: lat1 + (lat2-lat1)*fraction, lon: lon1 + (lon2-lon1)*fraction };
}

function generateSmartRoutes(startLoc, endLoc, baseAqi, mode) {
  const directDist = haversineKm(startLoc.lat, startLoc.lon, endLoc.lat, endLoc.lon);

  // Speed factors per mode (km/h)
  const speeds = { driving:35, walking:5, cycling:15, transit:25 };
  const speed  = speeds[mode] || 35;

  // Route 1: Direct/shortest
  const mid1    = getMidpoint(startLoc.lat, startLoc.lon, endLoc.lat, endLoc.lon);
  const factor1 = (getZoneAqiFactor(startLoc.lat, startLoc.lon) + getZoneAqiFactor(endLoc.lat, endLoc.lon) + getZoneAqiFactor(mid1.lat, mid1.lon)) / 3;
  const dist1   = parseFloat((directDist * 1.15).toFixed(1));
  const aqi1    = Math.round(baseAqi * factor1);

  // Route 2: Green corridor (detour via parks)
  const greenMid = nearGreenZone(mid1.lat, mid1.lon)
    ? mid1
    : GREEN_ZONES.reduce((best, g) => {
        const d = haversineKm(mid1.lat, mid1.lon, g.lat, g.lon);
        return d < haversineKm(mid1.lat, mid1.lon, best.lat, best.lon) ? g : best;
      }, GREEN_ZONES[0]);
  const dist2   = parseFloat((directDist * 1.35).toFixed(1));
  const factor2 = (getZoneAqiFactor(startLoc.lat, startLoc.lon) + 0.75 + getZoneAqiFactor(endLoc.lat, endLoc.lon)) / 3;
  const aqi2    = Math.round(baseAqi * factor2);

  // Route 3: Highway/fast
  const dist3   = parseFloat((directDist * 1.05).toFixed(1));
  const factor3 = (getZoneAqiFactor(startLoc.lat, startLoc.lon) + 1.2 + getZoneAqiFactor(endLoc.lat, endLoc.lon)) / 3;
  const aqi3    = Math.round(baseAqi * factor3);

  const routes = [
    {
      name: 'Green Corridor Route',
      via: `Via parks & tree-lined roads near ${startLoc.name}`,
      distance_km: dist2,
      estimated_time_minutes: Math.round((dist2 / speed) * 60),
      avg_aqi: Math.max(20, aqi2),
      category: helpers.getAQICategory(Math.max(20, aqi2)),
      color: helpers.getAQIColor(Math.max(20, aqi2)),
      health_impact: aqi2 <= 100 ? 'Low' : aqi2 <= 200 ? 'Moderate' : 'High',
      route_type: 'green',
    },
    {
      name: `Direct Route`,
      via: `Via main roads from ${startLoc.name} to ${endLoc.name}`,
      distance_km: dist1,
      estimated_time_minutes: Math.round((dist1 / speed) * 60),
      avg_aqi: Math.max(20, aqi1),
      category: helpers.getAQICategory(Math.max(20, aqi1)),
      color: helpers.getAQIColor(Math.max(20, aqi1)),
      health_impact: aqi1 <= 100 ? 'Low' : aqi1 <= 200 ? 'Moderate' : 'High',
      route_type: 'direct',
    },
    {
      name: 'Highway Express Route',
      via: `Via NH/Ring Road — fastest but higher exposure`,
      distance_km: dist3,
      estimated_time_minutes: Math.round((dist3 / speed) * 60),
      avg_aqi: Math.max(20, aqi3),
      category: helpers.getAQICategory(Math.max(20, aqi3)),
      color: helpers.getAQIColor(Math.max(20, aqi3)),
      health_impact: aqi3 <= 100 ? 'Low' : aqi3 <= 200 ? 'Moderate' : aqi3 <= 300 ? 'High' : 'Very High',
      route_type: 'highway',
    },
  ].sort((a, b) => a.avg_aqi - b.avg_aqi);

  return {
    safest_route: routes[0],
    alternative_routes: routes.slice(1),
    live_aqi: baseAqi,
    start: startLoc,
    end: endLoc,
    direct_distance_km: parseFloat(directDist.toFixed(1)),
    travel_mode: mode,
    generated_at: new Date().toISOString(),
  };
}

const SafeRoute = () => {
  const [start, setStart]         = useState('');
  const [end, setEnd]             = useState('');
  const [travelMode, setMode]     = useState('driving');
  const [routes, setRoutes]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [liveAqi, setLiveAqi]     = useState(null);
  const [useGPS, setUseGPS]       = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    aqiAPI.getLive().then(r => setLiveAqi(r.data)).catch(console.error);
  }, []);

  const getGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      setStart(`${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`);
      setUseGPS(true);
    });
  };

  const findRoutes = async (e) => {
    e.preventDefault();
    if (!start || !end) return;
    setError('');
    setLoading(true);
    try {
      const baseAqi   = liveAqi?.aqi || 150;
      const startLoc  = parseLocation(start);
      const endLoc    = parseLocation(end);
      const result    = generateSmartRoutes(startLoc, endLoc, baseAqi, travelMode);
      setRoutes(result);
    } catch (err) {
      setError('Could not calculate routes. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const modeIcons = { driving:'🚗', walking:'🚶', cycling:'🚴', transit:'🚌' };
  const modeAdvice = {
    driving: '🚗 Keep windows up, use recirculated AC',
    walking: '😷 Wear N95/FFP2 mask — filters 95%+ PM2.5',
    cycling: '😷 High exposure — N95 mask essential',
    transit: '🚌 AC transit preferred, avoid peak hours',
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24, maxWidth:1100, margin:'0 auto', padding:20 }}>

      {/* Live AQI banner */}
      {liveAqi && (
        <div style={{ background:`${helpers.getAQIColor(liveAqi.aqi)}12`, border:`2px solid ${helpers.getAQIColor(liveAqi.aqi)}30`, borderRadius:16, padding:'14px 20px', display:'flex', alignItems:'center', gap:16 }}>
          <span style={{ fontSize:36, fontWeight:900, color:helpers.getAQIColor(liveAqi.aqi), fontFamily:'monospace' }}>{liveAqi.aqi}</span>
          <div>
            <div style={{ fontWeight:700, color:'#1a1a1a' }}>Current Delhi AQI — {helpers.getAQICategory(liveAqi.aqi)}</div>
            <div style={{ fontSize:13, color:'#718096' }}>Route AQI exposure calculated from live readings • {liveAqi.city}</div>
          </div>
          <div style={{ marginLeft:'auto', fontSize:13, color:'#64748b', fontStyle:'italic' }}>
            {modeAdvice[travelMode]}
          </div>
        </div>
      )}

      {/* Form */}
      <div style={{ background:'white', borderRadius:24, padding:32, boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize:28, fontWeight:800, margin:'0 0 6px 0', color:'#1a1a1a' }}>🗺️ Find Your Safest Route</h2>
        <p style={{ color:'#718096', margin:'0 0 28px 0', fontSize:15 }}>Get AQI-optimized routes for healthier travel in Delhi-NCR</p>

        {error && <div style={{ background:'#fee2e2', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#dc2626' }}>⚠️ {error}</div>}

        <form onSubmit={findRoutes} style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {/* Start */}
          <div>
            <label style={{ display:'block', fontWeight:700, color:'#2d3748', fontSize:14, marginBottom:8 }}>Starting Point</label>
            <div style={{ display:'flex', gap:8 }}>
              <input value={start} onChange={e => { setStart(e.target.value); setUseGPS(false); }}
                placeholder="e.g. Connaught Place, Rohini, Anand Vihar..."
                required style={{ flex:1, padding:'14px 16px', border:'2px solid #e2e8f0', borderRadius:12, fontSize:14, outline:'none' }}
                onFocus={e => e.target.style.borderColor='#3b82f6'}
                onBlur={e => e.target.style.borderColor='#e2e8f0'}
              />
              <button type="button" onClick={getGPS} title="Use my location" style={{ padding:'14px 18px', background:'#eff6ff', border:'2px solid #bfdbfe', borderRadius:12, cursor:'pointer', fontSize:20 }}>📍</button>
            </div>
            {useGPS && <div style={{ fontSize:12, color:'#16a34a', marginTop:4, fontWeight:600 }}>✓ Using your GPS location</div>}
          </div>

          {/* End */}
          <div>
            <label style={{ display:'block', fontWeight:700, color:'#2d3748', fontSize:14, marginBottom:8 }}>Destination</label>
            <input value={end} onChange={e => setEnd(e.target.value)}
              placeholder="e.g. India Gate, Dwarka, Noida Sector 62..."
              required style={{ width:'100%', padding:'14px 16px', border:'2px solid #e2e8f0', borderRadius:12, fontSize:14, outline:'none', boxSizing:'border-box' }}
              onFocus={e => e.target.style.borderColor='#3b82f6'}
              onBlur={e => e.target.style.borderColor='#e2e8f0'}
            />
          </div>

          {/* Mode */}
          <div>
            <label style={{ display:'block', fontWeight:700, color:'#2d3748', fontSize:14, marginBottom:10 }}>Travel Mode</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
              {[
                { value:'driving', label:'Drive',   note:'Windows up'      },
                { value:'walking', label:'Walk',    note:'Mask advised'    },
                { value:'cycling', label:'Cycle',   note:'High exposure'   },
                { value:'transit', label:'Transit', note:'Lower exposure'  },
              ].map(m => (
                <button key={m.value} type="button" onClick={() => setMode(m.value)} style={{
                  display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                  padding:'16px 8px', borderRadius:14, border:'2px solid',
                  cursor:'pointer', transition:'all 0.2s', fontWeight:700,
                  background: travelMode === m.value ? '#3b82f6' : '#f8fafc',
                  color: travelMode === m.value ? 'white' : '#4a5568',
                  borderColor: travelMode === m.value ? '#3b82f6' : '#e2e8f0',
                }}>
                  <span style={{ fontSize:28 }}>{modeIcons[m.value]}</span>
                  <span style={{ fontSize:13 }}>{m.label}</span>
                  <span style={{ fontSize:10, opacity:0.7 }}>{m.note}</span>
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            padding:'16px', background:'linear-gradient(135deg,#667eea,#764ba2)',
            color:'white', border:'none', borderRadius:14, fontWeight:800,
            fontSize:16, cursor:'pointer', display:'flex', alignItems:'center',
            justifyContent:'center', gap:10, opacity: loading ? 0.7 : 1,
          }}>
            {loading
              ? <><span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite', display:'inline-block' }} /> Finding routes...</>
              : <><span>🔍</span> Find Safe Routes</>}
          </button>
        </form>
      </div>

      {/* Results */}
      {routes && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {/* Journey summary */}
          <div style={{ background:'white', borderRadius:16, padding:'14px 20px', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', display:'flex', gap:20, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontSize:14, color:'#64748b' }}>
              📍 <strong>{routes.start.name}</strong> → <strong>{routes.end.name}</strong>
            </span>
            <span style={{ fontSize:13, color:'#94a3b8' }}>Direct distance: {routes.direct_distance_km} km</span>
            <span style={{ fontSize:13, color:'#94a3b8' }}>{modeIcons[travelMode]} {travelMode.charAt(0).toUpperCase() + travelMode.slice(1)}</span>
          </div>

          {/* Safest route hero */}
          <div style={{ background:'linear-gradient(135deg,#667eea,#764ba2)', color:'white', borderRadius:24, padding:28, boxShadow:'0 8px 32px rgba(102,126,234,0.35)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, background:'rgba(255,255,255,0.06)', borderRadius:'50%' }} />
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.2)', padding:'6px 14px', borderRadius:20, fontSize:13, fontWeight:700, marginBottom:16 }}>
              ⭐ Recommended Safest Route
            </div>
            <h3 style={{ fontSize:22, fontWeight:900, margin:'0 0 6px 0' }}>{routes.safest_route.name}</h3>
            <p style={{ margin:'0 0 20px 0', opacity:0.8, fontSize:13 }}>{routes.safest_route.via}</p>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:20 }}>
              {[
                { label:'Distance',  value:`${routes.safest_route.distance_km} km` },
                { label:'Est. Time', value:`${routes.safest_route.estimated_time_minutes} min` },
                { label:'Avg AQI',   value: routes.safest_route.avg_aqi },
              ].map(s => (
                <div key={s.label} style={{ background:'rgba(255,255,255,0.15)', borderRadius:12, padding:'14px 16px' }}>
                  <div style={{ fontSize:11, opacity:0.75, marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontSize:26, fontWeight:900, fontFamily:'monospace' }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
              <div style={{ flex:1, height:8, background:'rgba(255,255,255,0.2)', borderRadius:4, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${Math.max(10, 100 - routes.safest_route.avg_aqi/5)}%`, background:'rgba(255,255,255,0.8)', borderRadius:4 }} />
              </div>
              <span style={{ fontWeight:700, fontSize:14 }}>{routes.safest_route.category}</span>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
              <span style={{ padding:'5px 14px', background:'rgba(255,255,255,0.2)', borderRadius:20, fontWeight:700, fontSize:13 }}>
                Health Impact: {routes.safest_route.health_impact}
              </span>
              <span style={{ padding:'5px 14px', background:'rgba(255,255,255,0.15)', borderRadius:20, fontWeight:700, fontSize:12 }}>
                {modeAdvice[travelMode]}
              </span>
            </div>
          </div>

          {/* Alternative routes */}
          {routes.alternative_routes?.length > 0 && (
            <>
              <h3 style={{ fontSize:18, fontWeight:800, color:'#1a1a1a', margin:'4px 0 0 0' }}>Alternative Routes</h3>
              {routes.alternative_routes.map((route, i) => {
                const aqiDiff = route.avg_aqi - routes.safest_route.avg_aqi;
                return (
                  <div key={i} style={{ background:'white', borderRadius:20, padding:24, boxShadow:'0 4px 20px rgba(0,0,0,0.07)', border:`1.5px solid ${route.color}30` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, flexWrap:'wrap', gap:12 }}>
                      <div>
                        <h4 style={{ fontSize:18, fontWeight:800, margin:'0 0 4px 0', color:'#1a1a1a' }}>{route.name}</h4>
                        <p style={{ margin:0, fontSize:13, color:'#718096' }}>{route.via}</p>
                      </div>
                      <span style={{ padding:'5px 14px', borderRadius:20, fontWeight:700, fontSize:12, background: aqiDiff > 0 ? '#fee2e2' : '#dcfce7', color: aqiDiff > 0 ? '#dc2626' : '#16a34a' }}>
                        {aqiDiff > 0 ? `+${aqiDiff}` : aqiDiff} AQI vs safest
                      </span>
                    </div>
                    <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
                      {[
                        { icon:'📏', value:`${route.distance_km} km` },
                        { icon:'⏱️', value:`${route.estimated_time_minutes} min` },
                        { icon:'💨', value:`AQI ${route.avg_aqi}` },
                        { icon:'❤️', value: route.health_impact },
                      ].map(s => (
                        <div key={s.icon} style={{ display:'flex', alignItems:'center', gap:6, fontSize:14, fontWeight:600, color:'#475569' }}>
                          <span>{s.icon}</span>{s.value}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Tips */}
          <div style={{ background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:16, padding:'16px 20px' }}>
            <div style={{ fontWeight:700, color:'#166534', marginBottom:8 }}>💡 Route Health Tips</div>
            <ul style={{ margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:6 }}>
              {[
                travelMode === 'walking' || travelMode === 'cycling'
                  ? 'Wear an N95/FFP2 mask — it filters 95%+ of PM2.5 particles'
                  : 'Keep windows up and use recirculated AC to minimize pollution intake',
                `Current AQI is ${liveAqi?.aqi || '—'}. ${(liveAqi?.aqi || 0) > 200 ? 'Consider postponing non-essential travel.' : 'Conditions are manageable with precautions.'}`,
                'Early morning (6–8 AM) typically has the lowest AQI in Delhi-NCR',
                `${routes.start.name} to ${routes.end.name}: ${routes.direct_distance_km} km direct — Green Corridor adds ${(routes.safest_route.distance_km - routes.direct_distance_km).toFixed(1)} km but reduces AQI exposure significantly`,
              ].map((tip, i) => (
                <li key={i} style={{ fontSize:13, color:'#166534', paddingLeft:16, position:'relative' }}>
                  <span style={{ position:'absolute', left:0 }}>→</span>{tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
      `}</style>
    </div>
  );
};

export default SafeRoute;
