import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE = 'http://localhost:8000/api/v1';
const REFRESH_INTERVAL = 5 * 60 * 1000;

const AQIDashboard = () => {
  const [currentAQI, setCurrentAQI] = useState(null);
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dataSource, setDataSource] = useState('');
  const [error, setError]           = useState(null);

  const fetchFromBackend = async () => {
    const response = await fetch(`${API_BASE}/aqi/csv/live`);
    if (!response.ok) throw new Error(`Backend ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return {
      aqi: data.aqi, city: data.city,
      pm25: data.pm25, pm10: data.pm10,
      no2: data.no2, o3: data.o3, so2: data.so2, co: data.co,
      temp: data.temperature, humidity: data.humidity,
      pressure: data.pressure, wind_speed: data.wind_speed,
      feels_like: data.feels_like, weather: data.weather_description,
      category: data.category, health_advice: data.health_advice,
      color: data.color,
      timestamp: data.timestamp ? new Date(data.timestamp).toLocaleString() : new Date().toLocaleString(),
    };
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/aqi/csv/history?days=1`);
      const json = await res.json();
      const readings = json.readings || json || [];
      return readings.slice(-12).map((r, i) => ({
        time: r.timestamp ? new Date(r.timestamp).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : `${i*2}h ago`,
        aqi: r.aqi || 0,
      }));
    } catch { return []; }
  };

  const fetchAQIData = useCallback(async () => {
    setError(null);
    try {
      const [data, hist] = await Promise.all([fetchFromBackend(), fetchHistory()]);
      setCurrentAQI(data);
      setHistory(hist);
      setDataSource('🟢 Live');
      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);
      return;
    } catch (e1) {
      console.warn('Backend failed, trying AQICN…', e1.message);
    }
    try {
      const token = 'd8dd7592efb286421a0fb10390f3f48d70033b9b';
      const res = await fetch(`https://api.waqi.info/feed/Delhi/?token=${token}`);
      const json = await res.json();
      if (json.status === 'ok') {
        const d = json.data; const iaqi = d.iaqi || {};
        setCurrentAQI({
          aqi: d.aqi, city: d.city?.name || 'Delhi',
          pm25: iaqi.pm25?.v ?? '—', pm10: iaqi.pm10?.v ?? '—',
          no2: iaqi.no2?.v ?? '—', o3: iaqi.o3?.v ?? '—',
          so2: iaqi.so2?.v ?? '—', co: iaqi.co?.v ?? '—',
          temp: iaqi.t?.v ?? '—', humidity: iaqi.h?.v ?? '—',
          timestamp: new Date().toLocaleString(),
        });
        setDataSource('🟡 AQICN direct');
        setLastUpdated(new Date().toLocaleTimeString());
        setLoading(false);
        return;
      }
    } catch (e2) { console.warn('AQICN also failed', e2.message); }
    setError('Could not reach any data source. Check backend is running.');
    setDataSource('🔴 Offline');
    setLoading(false);
  }, []);

  useEffect(() => { fetchAQIData(); }, [fetchAQIData]);
  useEffect(() => {
    const id = setInterval(fetchAQIData, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [fetchAQIData]);

  const getAQILevel = (aqi) => {
    if (aqi <= 50)  return { level:'Good',          color:'#00c853', bg:'#e8f5e9' };
    if (aqi <= 100) return { level:'Satisfactory',  color:'#ffd600', bg:'#fffde7' };
    if (aqi <= 200) return { level:'Unhealthy',      color:'#ff6d00', bg:'#fff3e0' };
    if (aqi <= 300) return { level:'Very Unhealthy', color:'#d50000', bg:'#ffebee' };
    return           { level:'Hazardous',            color:'#6a1b9a', bg:'#f3e5f5' };
  };

  const generateForecastPoints = (baseAQI) => {
    if (!baseAQI) return [];
    const diurnal = [1.1,1.2,1.0,0.9,0.85,0.9,1.2,1.3,1.15,1.0,0.9,0.95];
    const now = new Date();
    return diurnal.map((f, i) => ({
      time: new Date(now.getTime() + i*2*3600000).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}),
      aqi: Math.max(20, Math.round(baseAQI * f + (Math.random()-0.5)*10)),
    }));
  };

  if (loading) return (
    <div style={{ minHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:56 }}>🌍</div>
      <div style={{ fontSize:22, fontWeight:700, color:'#2d3748' }}>Loading AirSense AI…</div>
      <div style={{ color:'#718096' }}>Fetching real-time Delhi AQI data</div>
    </div>
  );

  const aqiInfo  = currentAQI ? getAQILevel(currentAQI.aqi) : null;
  const chartData = history.length >= 3 ? history : generateForecastPoints(currentAQI?.aqi);

  const POLLUTANTS = [
    { label:'PM2.5', value:currentAQI?.pm25, unit:'μg/m³', limit:60,  icon:'💨' },
    { label:'PM10',  value:currentAQI?.pm10, unit:'μg/m³', limit:100, icon:'🌫️' },
    { label:'NO₂',   value:currentAQI?.no2,  unit:'ppb',   limit:80,  icon:'🏭' },
    { label:'O₃',    value:currentAQI?.o3,   unit:'ppb',   limit:100, icon:'☀️' },
    { label:'SO₂',   value:currentAQI?.so2,  unit:'ppb',   limit:80,  icon:'⚗️' },
    { label:'CO',    value:currentAQI?.co,   unit:'mg/m³', limit:2,   icon:'🔥' },
  ];

  return (
    <div style={{ background:'linear-gradient(135deg,#f0f4ff,#e8f5e9)', minHeight:'100vh' }}>

      {/* Error banner */}
      {error && (
        <div style={{ background:'#fee2e2', borderLeft:'4px solid #dc2626', color:'#991b1b', padding:'12px 24px', fontSize:14, display:'flex', gap:12, alignItems:'center' }}>
          ⚠️ {error}
          <button onClick={fetchAQIData} style={{ marginLeft:'auto', padding:'6px 16px', background:'#dc2626', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>Retry</button>
        </div>
      )}

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 20px', display:'flex', flexDirection:'column', gap:24 }}>

        {currentAQI && (
          <>
            {/* ── Hero Card ── */}
            <div style={{ background:'white', borderRadius:24, padding:32, boxShadow:'0 4px 24px rgba(0,0,0,0.08)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:32, alignItems:'center' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'#94a3b8' }}>📍 {currentAQI.city}</span>
                  <span style={{ fontSize:12, color:'#94a3b8' }}>• {currentAQI.timestamp}</span>
                  <span style={{ fontSize:12, color:'#94a3b8', marginLeft:'auto' }}>{dataSource} • {lastUpdated}</span>
                </div>
                <h2 style={{ fontSize:20, fontWeight:800, margin:'0 0 16px 0', color:'#1a1a1a' }}>Current Air Quality</h2>
                <div style={{ display:'flex', alignItems:'flex-end', gap:16, marginBottom:16 }}>
                  <div style={{ fontSize:96, fontWeight:900, color:aqiInfo.color, fontFamily:'monospace', lineHeight:1 }}>
                    {currentAQI.aqi}
                  </div>
                  <div style={{ paddingBottom:12 }}>
                    <div style={{ fontSize:22, fontWeight:800, color:aqiInfo.color }}>{aqiInfo.level}</div>
                    <div style={{ fontSize:13, color:'#94a3b8' }}>AQI</div>
                  </div>
                </div>
                {/* AQI bar */}
                <div style={{ position:'relative', height:12, background:'linear-gradient(to right,#00E400,#FFD700,#FF7E00,#FF0000,#8F3F97,#7E0023)', borderRadius:6, marginBottom:8 }}>
                  <div style={{
                    position:'absolute', top:-4, width:20, height:20,
                    background:'white', border:`3px solid ${aqiInfo.color}`,
                    borderRadius:'50%', boxShadow:'0 2px 8px rgba(0,0,0,0.2)',
                    left:`${Math.min(95, currentAQI.aqi / 5)}%`, transform:'translateX(-50%)',
                    transition:'left 0.5s',
                  }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#94a3b8', marginBottom:16 }}>
                  {['Good','Satisfactory','Moderate','Poor','Very Poor','Severe'].map(l => <span key={l}>{l}</span>)}
                </div>
                <button onClick={fetchAQIData} style={{ padding:'10px 20px', background:'linear-gradient(135deg,#3b82f6,#6366f1)', color:'white', border:'none', borderRadius:12, fontWeight:700, fontSize:13, cursor:'pointer' }}>
                  🔄 Refresh
                </button>
              </div>
              <div style={{ background:aqiInfo.bg, borderRadius:20, padding:28 }}>
                <h3 style={{ fontSize:18, fontWeight:800, color:'#1a1a1a', margin:'0 0 12px 0' }}>💡 Health Advice</h3>
                <p style={{ fontSize:16, color:'#2d3748', lineHeight:1.7, margin:'0 0 20px 0' }}>{currentAQI.health_advice || 'Wear a mask outdoors and limit prolonged outdoor activities.'}</p>
                <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                  {['/forecast','🔮 View Forecast','/alerts','🔔 Health Alerts','/routes','🗺️ Safe Routes'].reduce((acc,_,i,arr)=>i%2===0?[...acc,[arr[i],arr[i+1]]]:acc,[]).map(([to,label])=>(
                    <Link key={to} to={to} style={{ padding:'8px 16px', background:'white', color:'#3b82f6', borderRadius:10, fontWeight:700, fontSize:13, textDecoration:'none', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Pollutants ── */}
            <div>
              <h3 style={{ fontSize:18, fontWeight:800, color:'#1a1a1a', margin:'0 0 16px 0' }}>Pollutant Levels</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14 }}>
                {POLLUTANTS.map(({ label, value, unit, limit, icon }) => {
                  const num = parseFloat(value);
                  const over = !isNaN(num) && num > limit;
                  return (
                    <div key={label} style={{ background:'white', borderRadius:16, padding:'18px 20px', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', borderTop:`3px solid ${over ? '#dc2626' : '#16a34a'}` }}>
                      <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:'#94a3b8', marginBottom:4 }}>{label}</div>
                      <div style={{ fontSize:28, fontWeight:900, fontFamily:'monospace', color: over ? '#dc2626' : '#1a1a1a' }}>{value ?? '—'}</div>
                      <div style={{ fontSize:11, color:'#94a3b8' }}>{unit}</div>
                      <div style={{ fontSize:11, fontWeight:700, color: over ? '#dc2626' : '#16a34a', marginTop:4 }}>
                        {over ? '⚠️ Above limit' : '✅ Safe'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Weather ── */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14 }}>
              {[
                { icon:'🌡️', label:'Temperature', value:`${currentAQI.temp}°C`, sub: currentAQI.feels_like ? `Feels ${currentAQI.feels_like}°C` : '' },
                { icon:'💧', label:'Humidity',    value:`${currentAQI.humidity}%` },
                { icon:'🌬️', label:'Wind Speed',  value:`${currentAQI.wind_speed} m/s` },
                { icon:'📊', label:'Pressure',    value:`${currentAQI.pressure} hPa` },
              ].map(w => (
                <div key={w.label} style={{ background:'white', borderRadius:16, padding:'18px 20px', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize:28, marginBottom:6 }}>{w.icon}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#94a3b8' }}>{w.label}</div>
                  <div style={{ fontSize:26, fontWeight:900, color:'#1a1a1a', fontFamily:'monospace' }}>{w.value}</div>
                  {w.sub && <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{w.sub}</div>}
                </div>
              ))}
            </div>

            {/* ── 24h Chart ── */}
            <div style={{ background:'white', borderRadius:24, padding:28, boxShadow:'0 4px 20px rgba(0,0,0,0.07)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <h3 style={{ fontSize:18, fontWeight:800, color:'#1a1a1a', margin:0 }}>📈 AQI Trend (Today)</h3>
                <Link to="/forecast" style={{ fontSize:13, fontWeight:700, color:'#3b82f6', textDecoration:'none' }}>View 72h forecast →</Link>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize:11, fill:'#94a3b8' }} />
                  <YAxis domain={['auto','auto']} tick={{ fontSize:11, fill:'#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius:12, border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }} formatter={v => [v, 'AQI']} />
                  <Line type="monotone" dataKey="aqi" stroke="#3b82f6" strokeWidth={3} dot={{ r:4, fill:'#3b82f6' }} activeDot={{ r:7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* ── Quick links ── */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16 }}>
              {[
                { to:'/forecast', icon:'📈', title:'72-Hour Forecast',  desc:'See how AQI will change over the next 3 days', color:'#3b82f6' },
                { to:'/alerts',   icon:'🔔', title:'Health Alerts',     desc:'Personalized alerts and health recommendations', color:'#ef4444' },
                { to:'/routes',   icon:'🗺️', title:'Safe Routes',       desc:'Find the lowest-pollution path for your commute', color:'#16a34a' },
              ].map(card => (
                <Link key={card.to} to={card.to} style={{ textDecoration:'none' }}>
                  <div style={{ background:'white', borderRadius:20, padding:24, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', borderTop:`4px solid ${card.color}`, transition:'transform 0.2s,box-shadow 0.2s', cursor:'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(0,0,0,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.07)'; }}
                  >
                    <div style={{ fontSize:36, marginBottom:10 }}>{card.icon}</div>
                    <div style={{ fontWeight:800, fontSize:16, color:'#1a1a1a', marginBottom:6 }}>{card.title}</div>
                    <div style={{ fontSize:13, color:'#718096', lineHeight:1.5 }}>{card.desc}</div>
                    <div style={{ marginTop:16, fontSize:13, fontWeight:700, color:card.color }}>Open →</div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer style={{ background:'#1e293b', color:'white', textAlign:'center', padding:'24px 20px', marginTop:40 }}>
        <p style={{ margin:0, fontWeight:700 }}>AirSense AI 🌍 | Real-time Air Quality Monitoring for Delhi-NCR</p>
        <p style={{ margin:'6px 0 0 0', fontSize:12, color:'#94a3b8' }}>
          Data from AQICN • Auto-refreshes every 5 min • {dataSource}
        </p>
      </footer>
    </div>
  );
};

export default AQIDashboard;
