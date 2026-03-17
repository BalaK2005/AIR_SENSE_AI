import React, { useState, useEffect } from 'react';
import { alertAPI, aqiAPI, helpers } from '../services/api';

const HealthAlerts = ({ currentAQI: propAQI }) => {
  const [alerts, setAlerts]   = useState([]);
  const [live, setLive]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [alertRes, liveRes] = await Promise.all([
        alertAPI.getMyAlerts(),
        aqiAPI.getLive(),
      ]);
      setAlerts(alertRes.data);
      setLive(liveRes.data);
    } catch (err) {
      console.error('HealthAlerts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (alertId) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'read' } : a));
    alertAPI.markAsRead(alertId).catch(() => {});
  };

  const currentAQI = live?.aqi || propAQI || 0;

  const getHealthInfo = (aqi) => {
    if (aqi <= 50)  return { level:'Good',        icon:'🌱', color:'#16a34a', bg:'linear-gradient(135deg,#16a34a,#22c55e)', advice:'Air quality is excellent. Perfect for all outdoor activities!',       actions:['Enjoy outdoor exercise','Open windows for fresh air','Great day for a walk or run','No precautions needed'] };
    if (aqi <= 100) return { level:'Satisfactory', icon:'😊', color:'#ca8a04', bg:'linear-gradient(135deg,#ca8a04,#eab308)', advice:'Acceptable air quality. Normal activities can continue.',             actions:['Continue normal outdoor activities','Sensitive individuals should monitor symptoms','Keep an eye on AQI trends'] };
    if (aqi <= 200) return { level:'Moderate',     icon:'⚠️', color:'#ea580c', bg:'linear-gradient(135deg,#ea580c,#f97316)', advice:'Sensitive individuals may experience breathing discomfort.',         actions:['Limit prolonged outdoor exertion','Wear mask if you are sensitive','Keep windows closed in peak hours','Use air purifier indoors'] };
    if (aqi <= 300) return { level:'Poor',         icon:'😷', color:'#dc2626', bg:'linear-gradient(135deg,#dc2626,#ef4444)', advice:'Everyone may experience health effects. Reduce outdoor activities.', actions:['Avoid outdoor exertion','Wear N95 mask outdoors','Use air purifiers indoors','Close all windows and doors','Children & elderly stay indoors'] };
    if (aqi <= 400) return { level:'Very Poor',    icon:'🚨', color:'#7c3aed', bg:'linear-gradient(135deg,#7c3aed,#8b5cf6)', advice:'Health alert! Everyone may experience serious health effects.',      actions:['Stay indoors at all times','Run air purifiers continuously','Wear N95 if emergency exit needed','Seek medical advice if symptoms appear','Avoid cooking with open flame'] };
    return           { level:'Severe',             icon:'🆘', color:'#7e0023', bg:'linear-gradient(135deg,#7e0023,#991b1b)', advice:'Emergency: Stay indoors with doors and windows sealed.',             actions:['Do NOT go outside','Seal gaps in doors and windows','Run air purifiers on max','Call emergency services if breathing issues','This is a health emergency'] };
  };

  const severityOrder = { emergency:0, critical:1, warning:2, info:3 };
  const severityIcon  = { emergency:'🆘', critical:'🚨', warning:'⚠️', info:'💡' };
  const severityColor = { emergency:'#7e0023', critical:'#dc2626', warning:'#ea580c', info:'#3b82f6' };

  const filtered = alerts
    .filter(a => filter === 'all' ? true : filter === 'unread' ? a.status !== 'read' : a.severity === filter)
    .sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));

  const health = getHealthInfo(currentAQI);
  const unreadCount = alerts.filter(a => a.status !== 'read').length;

  if (loading) return (
    <div style={{ textAlign:'center', padding:60 }}>
      <div style={{ fontSize:48 }}>⏳</div>
      <p style={{ color:'#718096', marginTop:12 }}>Loading health alerts from live AQI data...</p>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24, padding:20 }}>

      {/* ── Health Advice Hero ── */}
      <div style={{ background:health.bg, borderRadius:24, padding:32, color:'white', boxShadow:'0 10px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:20 }}>
          <span style={{ fontSize:56, filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>{health.icon}</span>
          <div>
            <h2 style={{ fontSize:32, fontWeight:900, margin:0, textShadow:'0 2px 4px rgba(0,0,0,0.2)' }}>{health.level}</h2>
            <p style={{ margin:'6px 0 0 0', fontSize:15, opacity:0.9 }}>Current AQI: <strong style={{ fontSize:20, fontFamily:'monospace' }}>{currentAQI}</strong> • {live?.city || 'Delhi'}</p>
          </div>
        </div>

        <p style={{ fontSize:17, lineHeight:1.7, margin:'0 0 20px 0', fontWeight:500 }}>{health.advice}</p>

        <div>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:12, opacity:0.9 }}>✅ Recommended Actions:</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:10 }}>
            {health.actions.map((action, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.15)', borderRadius:10, padding:'10px 14px', fontSize:14 }}>
                <span style={{ width:22, height:22, background:'rgba(255,255,255,0.3)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontWeight:900, fontSize:12 }}>✓</span>
                {action}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Pollutant Quick View ── */}
      {live && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:12 }}>
          {[
            { label:'PM2.5', value:live.pm25, limit:60,  unit:'μg/m³' },
            { label:'PM10',  value:live.pm10, limit:100, unit:'μg/m³' },
            { label:'NO₂',   value:live.no2,  limit:80,  unit:'ppb'   },
            { label:'O₃',    value:live.o3,   limit:100, unit:'ppb'   },
            { label:'SO₂',   value:live.so2,  limit:80,  unit:'ppb'   },
            { label:'CO',    value:live.co,   limit:2,   unit:'mg/m³' },
          ].map(p => {
            const over = (p.value || 0) > p.limit;
            return (
              <div key={p.label} style={{ background:'white', borderRadius:14, padding:'14px 16px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', borderTop:`3px solid ${over ? '#dc2626' : '#16a34a'}` }}>
                <div style={{ fontSize:12, color:'#94a3b8', fontWeight:600 }}>{p.label}</div>
                <div style={{ fontSize:22, fontWeight:900, color: over ? '#dc2626' : '#16a34a', fontFamily:'monospace', margin:'4px 0' }}>{p.value ?? '—'}</div>
                <div style={{ fontSize:10, color:'#94a3b8' }}>{p.unit}</div>
                <div style={{ fontSize:10, fontWeight:700, color: over ? '#dc2626' : '#16a34a' }}>{over ? '⚠️ Above limit' : '✅ Safe'}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Alerts Section ── */}
      <div style={{ background:'white', borderRadius:20, padding:24, boxShadow:'0 4px 20px rgba(0,0,0,0.07)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <h3 style={{ fontSize:20, fontWeight:800, margin:0, color:'#1a1a1a' }}>🔔 Your Alerts</h3>
            {unreadCount > 0 && (
              <span style={{ background:'#dc2626', color:'white', borderRadius:20, padding:'3px 10px', fontSize:12, fontWeight:700 }}>{unreadCount} new</span>
            )}
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {['all','unread','emergency','critical','warning','info'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding:'6px 14px', border:'2px solid', borderRadius:8,
                fontWeight:600, cursor:'pointer', fontSize:12,
                background: filter === f ? '#3b82f6' : 'white',
                color: filter === f ? 'white' : '#4a5568',
                borderColor: filter === f ? '#3b82f6' : '#e2e8f0',
              }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>
              <span style={{ fontSize:48, display:'block', marginBottom:12 }}>✨</span>
              <p>No alerts for this filter</p>
            </div>
          ) : filtered.map(alert => (
            <div key={alert.id} onClick={() => markAsRead(alert.id)} style={{
              display:'flex', gap:16, padding:16, borderRadius:14, cursor:'pointer',
              background: alert.status !== 'read' ? `${severityColor[alert.severity]}08` : '#f8fafc',
              borderLeft: `4px solid ${alert.status !== 'read' ? severityColor[alert.severity] : '#e2e8f0'}`,
              transition:'all 0.2s', position:'relative',
            }}
              onMouseEnter={e => e.currentTarget.style.transform='translateX(4px)'}
              onMouseLeave={e => e.currentTarget.style.transform=''}
            >
              <span style={{ fontSize:28, flexShrink:0 }}>{severityIcon[alert.severity] || '📢'}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:15, color:'#1a1a1a', marginBottom:4 }}>{alert.title}</div>
                <div style={{ fontSize:13, color:'#4a5568', lineHeight:1.5, marginBottom:8 }}>{alert.message}</div>
                <div style={{ display:'flex', gap:16, fontSize:11, color:'#94a3b8' }}>
                  <span>🕐 {new Date(alert.created_at).toLocaleString('en-IN', { hour:'2-digit', minute:'2-digit', day:'numeric', month:'short' })}</span>
                  {alert.location && <span>📍 {alert.location}</span>}
                </div>
              </div>
              {alert.status !== 'read' && (
                <div style={{ position:'absolute', top:16, right:16, width:10, height:10, background:severityColor[alert.severity], borderRadius:'50%', animation:'pulse 2s infinite' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
};

export default HealthAlerts;
