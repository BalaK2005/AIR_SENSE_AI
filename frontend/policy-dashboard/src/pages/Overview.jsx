import React, { useState, useEffect, useCallback } from 'react';
import { aqiAPI, helpers } from '../services/api';

const Overview = () => {
  const [live, setLive]         = useState(null);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [lastSync, setLastSync] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [liveRes, statsRes] = await Promise.all([
        aqiAPI.getLive(),
        aqiAPI.getStats(),
      ]);
      setLive(liveRes.data);
      setStats(statsRes.data);
      setLastSync(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Overview fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const t = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [fetchData]);

  const aqiColor    = helpers.getAQIColor(live?.aqi    || 0);
  const aqiCategory = helpers.getAQICategory(live?.aqi || 0);

  const pollutants = live ? [
    { name: 'PM2.5', value: live.pm25, limit: 60,  unit: 'μg/m³', color: '#ef4444' },
    { name: 'PM10',  value: live.pm10, limit: 100, unit: 'μg/m³', color: '#f97316' },
    { name: 'NO₂',   value: live.no2,  limit: 80,  unit: 'ppb',   color: '#eab308' },
    { name: 'O₃',    value: live.o3,   limit: 100, unit: 'ppb',   color: '#22c55e' },
    { name: 'SO₂',   value: live.so2,  limit: 80,  unit: 'ppb',   color: '#3b82f6' },
    { name: 'CO',    value: live.co,   limit: 2,   unit: 'mg/m³', color: '#8b5cf6' },
  ] : [];

  const ncr_regions = [
    { name: 'Delhi',     aqi: live?.aqi,                     color: aqiColor },
    { name: 'Noida',     aqi: live?.aqi ? Math.round(live.aqi * 0.88) : null, color: '#FF7E00' },
    { name: 'Gurgaon',   aqi: live?.aqi ? Math.round(live.aqi * 0.82) : null, color: '#FF7E00' },
    { name: 'Ghaziabad', aqi: live?.aqi ? Math.round(live.aqi * 0.95) : null, color: '#FF0000' },
    { name: 'Faridabad', aqi: live?.aqi ? Math.round(live.aqi * 0.79) : null, color: '#FF7E00' },
  ];

  return (
    <div className="overview-page">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Delhi-NCR Air Quality Overview</h1>
          <p className="page-subtitle">
            Real-time monitoring and regional analysis
            {lastSync && <span style={{ marginLeft:12, fontSize:12, color:'#a0aec0' }}>• Synced {lastSync}</span>}
          </p>
        </div>
        <div className="header-actions">
          <button className="action-btn" onClick={() => window.print()}>📊 Export Report</button>
          <button className="action-btn primary" onClick={fetchData}>🔄 Refresh Data</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:60 }}>
          <div style={{ fontSize:48 }}>⏳</div>
          <p style={{ color:'#718096', marginTop:16 }}>Loading live data from AQICN...</p>
        </div>
      ) : (
        <>
          {/* ── AQI Hero ── */}
          <div className="aqi-hero" style={{ background:`${aqiColor}12`, border:`2px solid ${aqiColor}30` }}>
            <div className="hero-left">
              <div style={{ fontSize:11, color:'#718096', fontWeight:700, marginBottom:8 }}>
                📍 {live?.city || 'Delhi, India'} • {live?.timestamp || '—'}
              </div>
              <div style={{ fontSize:88, fontWeight:900, color:aqiColor, fontFamily:'monospace', lineHeight:1 }}>
                {live?.aqi ?? '—'}
              </div>
              <div style={{ fontSize:16, color:'#475569', marginTop:4 }}>Air Quality Index</div>
              <div style={{ display:'inline-block', marginTop:12, padding:'8px 20px', background:aqiColor, color:'#fff', borderRadius:50, fontWeight:800, fontSize:16 }}>
                {aqiCategory}
              </div>
            </div>
            <div className="hero-right">
              <div style={{ background:'#fff', borderRadius:16, padding:'20px 24px', border:'1.5px solid #e2e8f0', minWidth:260 }}>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:12, color:'#1a1a1a' }}>🌤️ Weather Conditions</div>
                <div className="weather-grid">
                  <div className="weather-item"><span>🌡️</span>{live?.temperature}°C</div>
                  <div className="weather-item"><span>💧</span>{live?.humidity?.toFixed(0)}%</div>
                  <div className="weather-item"><span>🌬️</span>{live?.wind_speed} m/s</div>
                  <div className="weather-item"><span>☁️</span>{live?.weather_description}</div>
                </div>
              </div>
              <div style={{ background:'#fff', borderRadius:16, padding:'20px 24px', border:'1.5px solid #e2e8f0' }}>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:8, color:'#1a1a1a' }}>💡 Health Advisory</div>
                <div style={{ fontSize:13, color:'#64748b', lineHeight:1.6 }}>{live?.health_advice || '—'}</div>
              </div>
            </div>
          </div>

          {/* ── Key Metrics ── */}
          <div className="metrics-grid">
            {[
              { icon:'📊', label:'Avg AQI (All-time)', value: stats?.aqi?.average ?? '—', accent:'#8b5cf6' },
              { icon:'📈', label:'Peak AQI Recorded',  value: stats?.aqi?.max     ?? '—', accent:'#ef4444' },
              { icon:'📉', label:'Best AQI Recorded',  value: stats?.aqi?.min     ?? '—', accent:'#16a34a' },
              { icon:'📋', label:'Total Readings',      value: stats?.total_records ?? '—', accent:'#0891b2' },
            ].map(m => (
              <div key={m.label} className="metric-card" style={{ borderLeft:`4px solid ${m.accent}` }}>
                <div className="metric-header"><span>{m.icon}</span><span className="metric-label">{m.label}</span></div>
                <div className="metric-value" style={{ color: m.accent }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* ── Pollutants ── */}
          <div className="section-card">
            <div className="section-header">
              <h2>💨 Pollutant Breakdown</h2>
              <span className="live-indicator"><span className="pulse-dot"></span>Live</span>
            </div>
            <div className="pollutant-grid">
              {pollutants.map(p => {
                const pct = Math.min(100, ((p.value || 0) / (p.limit * 1.8)) * 100);
                const over = (p.value || 0) > p.limit;
                return (
                  <div key={p.name} className="pollutant-card" style={{ borderTop:`3px solid ${p.color}`, background: over ? '#fff5f5' : '#fafafa' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
                      <span style={{ fontWeight:800, color:'#1a1a1a' }}>{p.name}</span>
                      <span style={{ fontSize:20, fontWeight:900, color: over ? '#ef4444' : '#16a34a', fontFamily:'monospace' }}>{p.value ?? '—'}</span>
                    </div>
                    <div style={{ height:6, background:'#e2e8f0', borderRadius:3, overflow:'hidden', marginBottom:6 }}>
                      <div style={{ height:'100%', width:`${pct}%`, background: over ? '#ef4444' : p.color, borderRadius:3 }} />
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#a0aec0' }}>
                      <span>{p.unit}</span>
                      <span style={{ color: over ? '#ef4444' : '#16a34a' }}>{over ? '⚠️ Above limit' : '✅ Safe'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── NCR Regions ── */}
          <div className="section-card">
            <div className="section-header"><h2>🗺️ NCR Regional Comparison</h2></div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:16 }}>
              {ncr_regions.map(r => (
                <div key={r.name} style={{
                  textAlign:'center', padding:20, borderRadius:12,
                  background: r.color + '12', border:`2px solid ${r.color}30`,
                }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#475569', marginBottom:8 }}>{r.name}</div>
                  <div style={{ fontSize:36, fontWeight:900, color:r.color, fontFamily:'monospace' }}>{r.aqi ?? '—'}</div>
                  <div style={{ fontSize:11, color:r.color, fontWeight:700, marginTop:4 }}>{r.aqi ? helpers.getAQICategory(r.aqi) : 'N/A'}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:12, fontSize:12, color:'#a0aec0', textAlign:'center' }}>
              * NCR city values are estimated relative to Delhi monitoring station. Source: AQICN
            </div>
          </div>

          {/* ── Active Alerts ── */}
          {live?.aqi > 150 && (
            <div className="section-card">
              <h2 style={{ margin:'0 0 16px 0', fontSize:18, fontWeight:800, color:'#1a1a1a' }}>🚨 Active Alerts</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {live.aqi > 300 && (
                  <div style={{ padding:'14px 20px', background:'#fff1f2', border:'1.5px solid #fecdd3', borderLeft:'4px solid #ef4444', borderRadius:10, display:'flex', gap:12 }}>
                    <span style={{ fontSize:20 }}>🚨</span>
                    <div><strong style={{ color:'#dc2626' }}>HAZARDOUS AQI — Emergency Level</strong><p style={{ margin:'4px 0 0', fontSize:13, color:'#718096' }}>Consider emergency policy interventions immediately. Schools and outdoor activities should halt.</p></div>
                  </div>
                )}
                {live.aqi > 200 && live.aqi <= 300 && (
                  <div style={{ padding:'14px 20px', background:'#fff7ed', border:'1.5px solid #fed7aa', borderLeft:'4px solid #f97316', borderRadius:10, display:'flex', gap:12 }}>
                    <span style={{ fontSize:20 }}>⚠️</span>
                    <div><strong style={{ color:'#c2410c' }}>Very Unhealthy AQI</strong><p style={{ margin:'4px 0 0', fontSize:13, color:'#718096' }}>Implement traffic restrictions and industrial checks. Advise citizens to stay indoors.</p></div>
                  </div>
                )}
                {live.aqi > 150 && live.aqi <= 200 && (
                  <div style={{ padding:'14px 20px', background:'#fefce8', border:'1.5px solid #fde047', borderLeft:'4px solid #eab308', borderRadius:10, display:'flex', gap:12 }}>
                    <span style={{ fontSize:20 }}>⚠️</span>
                    <div><strong style={{ color:'#854d0e' }}>Unhealthy AQI</strong><p style={{ margin:'4px 0 0', fontSize:13, color:'#718096' }}>Sensitive groups should limit outdoor exposure. Consider odd-even vehicle scheme.</p></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .overview-page { padding:32px; max-width:1800px; margin:0 auto; }
        .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; flex-wrap:wrap; gap:20px; }
        .page-title { font-size:32px; font-weight:900; margin:0; color:#1a1a1a; }
        .page-subtitle { color:#718096; margin:4px 0 0 0; font-size:15px; }
        .header-actions { display:flex; gap:12px; }
        .action-btn { display:flex; align-items:center; gap:8px; padding:10px 18px; background:white; border:2px solid #e2e8f0; border-radius:10px; font-weight:600; cursor:pointer; font-size:14px; transition:all 0.2s; }
        .action-btn:hover { border-color:#cbd5e0; transform:translateY(-1px); }
        .action-btn.primary { background:linear-gradient(135deg,#667eea 0%,#764ba2 100%); color:white; border-color:transparent; }
        .aqi-hero { border-radius:20px; padding:32px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:24px; }
        .hero-left { flex:1; }
        .hero-right { display:flex; flex-direction:column; gap:16px; min-width:260px; }
        .weather-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .weather-item { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:600; color:#475569; }
        .metrics-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
        .metric-card { background:white; border-radius:12px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.06); }
        .metric-header { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
        .metric-label { font-size:12px; color:#718096; font-weight:600; }
        .metric-value { font-size:32px; font-weight:900; fontFamily:monospace; }
        .section-card { background:white; border-radius:16px; padding:24px; box-shadow:0 2px 12px rgba(0,0,0,0.07); margin-bottom:24px; }
        .section-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
        .section-header h2 { font-size:18px; font-weight:800; margin:0; color:#1a1a1a; }
        .live-indicator { display:flex; align-items:center; gap:6px; padding:5px 12px; background:#16a34a; color:white; border-radius:20px; font-size:12px; font-weight:700; }
        .pulse-dot { width:7px; height:7px; background:white; border-radius:50%; animation:pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .pollutant-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:16px; }
        .pollutant-card { padding:16px; border-radius:12px; }
        @media(max-width:1200px){ .metrics-grid{grid-template-columns:repeat(2,1fr);} }
        @media(max-width:768px){ .overview-page{padding:16px;} .metrics-grid{grid-template-columns:1fr;} }
      `}</style>
    </div>
  );
};

export default Overview;