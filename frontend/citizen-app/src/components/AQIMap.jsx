import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { aqiAPI, helpers } from '../services/api';

// 17 NCR monitoring stations
const STATIONS = [
  { id:'s1',  name:'Major Dhyan Chand Stadium', region:'Delhi',     lat:28.6139, lon:77.2373, primary:true  },
  { id:'s2',  name:'ITO',                        region:'Delhi',     lat:28.6289, lon:77.2401 },
  { id:'s3',  name:'Anand Vihar',                region:'Delhi',     lat:28.6469, lon:77.3160 },
  { id:'s4',  name:'RK Puram',                   region:'Delhi',     lat:28.5635, lon:77.1870 },
  { id:'s5',  name:'Punjabi Bagh',               region:'Delhi',     lat:28.6720, lon:77.1310 },
  { id:'s6',  name:'Dwarka Sector 8',            region:'Delhi',     lat:28.5921, lon:77.0460 },
  { id:'s7',  name:'Rohini',                     region:'Delhi',     lat:28.7495, lon:77.0674 },
  { id:'s8',  name:'Okhla Phase 2',              region:'Delhi',     lat:28.5314, lon:77.2735 },
  { id:'s9',  name:'Sector 62, Noida',           region:'Noida',     lat:28.6209, lon:77.3687 },
  { id:'s10', name:'Sector 1, Noida',            region:'Noida',     lat:28.5355, lon:77.3910 },
  { id:'s11', name:'Sector 125, Noida',          region:'Noida',     lat:28.5447, lon:77.3182 },
  { id:'s12', name:'Gurgaon City',               region:'Gurgaon',   lat:28.4595, lon:77.0266 },
  { id:'s13', name:'Sector 51, Gurgaon',         region:'Gurgaon',   lat:28.4282, lon:77.0689 },
  { id:'s14', name:'Ghaziabad Vasundhara',       region:'Ghaziabad', lat:28.6692, lon:77.3754 },
  { id:'s15', name:'Loni, Ghaziabad',            region:'Ghaziabad', lat:28.7517, lon:77.2884 },
  { id:'s16', name:'Faridabad Sector 11',        region:'Faridabad', lat:28.4089, lon:77.3178 },
  { id:'s17', name:'NIT Faridabad',              region:'Faridabad', lat:28.3830, lon:77.3120 },
];

const REGION_OFFSET = { Delhi:0, Noida:8, Gurgaon:-12, Ghaziabad:18, Faridabad:5 };
const STATION_VAR   = { s1:0,s2:15,s3:28,s4:-8,s5:5,s6:-15,s7:10,s8:20,s9:8,s10:2,s11:-5,s12:-12,s13:-18,s14:22,s15:30,s16:5,s17:-3 };

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

const AQIMap = () => {
  const [stations, setStations]   = useState([]);
  const [live, setLive]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [viewMode, setViewMode]   = useState('pins');    // pins | heat
  const [filter, setFilter]       = useState('all');     // all | good | moderate | poor
  const [selected, setSelected]   = useState(null);
  const [lastUpdated, setUpdated] = useState('');
  const center = [28.6139, 77.2090];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Try backend stations endpoint first
      const res = await fetch('http://localhost:8000/api/v1/forecast/stations');
      if (res.ok) {
        const data = await res.json();
        setStations(data.stations || []);
        setLive({ aqi: data.base_aqi, city: 'Delhi' });
      } else {
        throw new Error('stations endpoint failed');
      }
    } catch {
      // Fallback: derive from live CSV
      try {
        const liveRes = await aqiAPI.getLive();
        const base    = liveRes.data?.aqi || 150;
        setLive(liveRes.data);
        setStations(STATIONS.map(s => ({
          ...s,
          station_id:   s.id,
          station_name: s.name,
          latitude:     s.lat,
          longitude:    s.lon,
          aqi:          Math.max(20, base + (REGION_OFFSET[s.region] || 0) + (STATION_VAR[s.id] || 0)),
          is_live:      s.primary || false,
        })));
      } catch (err) {
        console.error('AQIMap: both sources failed', err);
      }
    }
    setUpdated(new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }));
    setLoading(false);
  };

  const filtered = stations.filter(s => {
    if (filter === 'all')      return true;
    if (filter === 'good')     return s.aqi <= 100;
    if (filter === 'moderate') return s.aqi > 100 && s.aqi <= 200;
    if (filter === 'poor')     return s.aqi > 200;
    return true;
  });

  const ncrAvg = stations.length
    ? Math.round(stations.reduce((a, b) => a + b.aqi, 0) / stations.length)
    : 0;

  const worst = stations.length ? stations.reduce((a, b) => a.aqi > b.aqi ? a : b) : null;
  const best  = stations.length ? stations.reduce((a, b) => a.aqi < b.aqi ? a : b) : null;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, maxWidth:1200, margin:'0 auto', padding:20 }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
        <div>
          <h2 style={{ fontSize:28, fontWeight:900, margin:0, color:'#1a1a1a' }}>🗺️ Delhi-NCR AQI Map</h2>
          <p style={{ color:'#718096', margin:'4px 0 0 0', fontSize:14 }}>
            Live air quality across {stations.length} monitoring stations
            {lastUpdated && <span> • Updated {lastUpdated}</span>}
          </p>
        </div>
        <button onClick={fetchData} style={{ padding:'10px 20px', background:'#eff6ff', border:'2px solid #bfdbfe', borderRadius:12, fontWeight:700, cursor:'pointer', fontSize:13, color:'#1d4ed8' }}>
          🔄 Refresh
        </button>
      </div>

      {/* Summary cards */}
      {!loading && stations.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14 }}>
          {[
            { label:'NCR Average', value:ncrAvg,      color:helpers.getAQIColor(ncrAvg),      sub:helpers.getAQICategory(ncrAvg) },
            { label:'Worst Station',value:worst?.aqi,  color:helpers.getAQIColor(worst?.aqi),  sub:worst?.station_name?.split(',')[0] },
            { label:'Best Station', value:best?.aqi,   color:helpers.getAQIColor(best?.aqi),   sub:best?.station_name?.split(',')[0] },
            { label:'Stations Live',value:stations.filter(s=>s.is_live).length + '/' + stations.length, color:'#16a34a', sub:'Active monitors' },
          ].map(c => (
            <div key={c.label} style={{ background:'white', borderRadius:16, padding:'16px 20px', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', borderTop:`3px solid ${c.color}` }}>
              <div style={{ fontSize:12, color:'#94a3b8', fontWeight:700, marginBottom:6 }}>{c.label}</div>
              <div style={{ fontSize:28, fontWeight:900, color:c.color, fontFamily:'monospace' }}>{c.value}</div>
              <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{c.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', gap:8, background:'#f8fafc', padding:4, borderRadius:12 }}>
          {[['pins','📍 Stations'],['heat','🔥 Heatmap']].map(([mode, label]) => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{
              padding:'8px 16px', borderRadius:9, border:'none', fontWeight:700, fontSize:13,
              background: viewMode === mode ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'transparent',
              color: viewMode === mode ? 'white' : '#4a5568', cursor:'pointer',
            }}>{label}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {[['all','All'],['good','Good (≤100)'],['moderate','Moderate'],['poor','Poor (>200)']].map(([f, label]) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:'7px 14px', borderRadius:20, border:'2px solid', fontSize:12, fontWeight:700, cursor:'pointer',
              background: filter === f ? '#3b82f6' : 'white',
              color: filter === f ? 'white' : '#4a5568',
              borderColor: filter === f ? '#3b82f6' : '#e2e8f0',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div style={{ borderRadius:20, overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,0.1)', height:520 }}>
        {loading ? (
          <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc', flexDirection:'column', gap:16 }}>
            <div style={{ fontSize:48 }}>🗺️</div>
            <div style={{ color:'#718096', fontWeight:600 }}>Loading live station data…</div>
          </div>
        ) : (
          <MapContainer center={center} zoom={10} style={{ height:'100%', width:'100%' }}>
            <MapRecenter center={center} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
            />

            {/* Station pins */}
            {viewMode === 'pins' && filtered.map(s => (
              <CircleMarker
                key={s.station_id || s.id}
                center={[s.latitude || s.lat, s.longitude || s.lon]}
                radius={s.is_live ? 14 : 10}
                pathOptions={{
                  fillColor:   helpers.getAQIColor(s.aqi),
                  fillOpacity: 0.9,
                  color:       s.is_live ? '#fff' : '#ffffff88',
                  weight:      s.is_live ? 3 : 1.5,
                }}
                eventHandlers={{ click: () => setSelected(s) }}
              >
                <Popup>
                  <div style={{ minWidth:190, fontFamily:'sans-serif' }}>
                    <div style={{ fontWeight:800, fontSize:14, marginBottom:6, color:'#1a1a1a' }}>
                      {s.is_live ? '🟢 ' : ''}{s.station_name || s.name}
                    </div>
                    <div style={{ fontSize:32, fontWeight:900, color:helpers.getAQIColor(s.aqi), fontFamily:'monospace', marginBottom:4 }}>
                      {s.aqi}
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:helpers.getAQIColor(s.aqi), marginBottom:8 }}>
                      {helpers.getAQICategory(s.aqi)}
                    </div>
                    {s.pm25 != null && <div style={{ fontSize:12, color:'#4a5568' }}>PM2.5: <strong>{Math.round(s.pm25)} μg/m³</strong></div>}
                    {s.pm10 != null && <div style={{ fontSize:12, color:'#4a5568' }}>PM10: <strong>{Math.round(s.pm10)} μg/m³</strong></div>}
                    <div style={{ fontSize:11, color:'#94a3b8', marginTop:6 }}>
                      📍 {s.region} {s.is_live ? '• Live reading' : '• Estimated'}
                    </div>
                    <div style={{ marginTop:10, padding:'6px 10px', background:helpers.getAQIColor(s.aqi) + '15', borderRadius:8, fontSize:11, color:'#1a1a1a' }}>
                      {s.aqi <= 50  ? '✅ Great for outdoor activities' :
                       s.aqi <= 100 ? '⚠️ Sensitive groups should be cautious' :
                       s.aqi <= 200 ? '😷 Wear mask outdoors' :
                       s.aqi <= 300 ? '🚫 Avoid outdoor activities' :
                                      '🆘 Stay indoors — health emergency'}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* Heatmap mode — large transparent circles */}
            {viewMode === 'heat' && filtered.map(s => (
              <CircleMarker
                key={s.station_id || s.id}
                center={[s.latitude || s.lat, s.longitude || s.lon]}
                radius={35}
                pathOptions={{
                  fillColor:   helpers.getAQIColor(s.aqi),
                  fillOpacity: 0.25,
                  color:       helpers.getAQIColor(s.aqi),
                  weight:      1,
                  opacity:     0.4,
                }}
              >
                <Popup>
                  <div style={{ fontFamily:'sans-serif' }}>
                    <strong>{s.station_name || s.name}</strong><br/>
                    AQI: <strong style={{ color:helpers.getAQIColor(s.aqi) }}>{s.aqi}</strong> — {helpers.getAQICategory(s.aqi)}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Station list */}
      <div style={{ background:'white', borderRadius:20, padding:24, boxShadow:'0 4px 20px rgba(0,0,0,0.07)' }}>
        <h3 style={{ fontSize:18, fontWeight:800, margin:'0 0 16px 0', color:'#1a1a1a' }}>
          📋 All Stations ({filtered.length})
        </h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
          {filtered.sort((a,b) => b.aqi - a.aqi).map(s => (
            <div key={s.station_id || s.id} style={{
              display:'flex', alignItems:'center', gap:14, padding:'12px 16px',
              background:`${helpers.getAQIColor(s.aqi)}08`,
              border:`1.5px solid ${helpers.getAQIColor(s.aqi)}25`,
              borderLeft:`4px solid ${helpers.getAQIColor(s.aqi)}`,
              borderRadius:12, cursor:'pointer', transition:'transform 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.transform='translateX(4px)'}
              onMouseLeave={e => e.currentTarget.style.transform=''}
            >
              <div style={{ fontSize:28, fontWeight:900, color:helpers.getAQIColor(s.aqi), fontFamily:'monospace', minWidth:48, textAlign:'center' }}>
                {s.aqi}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:13, color:'#1a1a1a', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {s.is_live ? '🟢 ' : ''}{s.station_name || s.name}
                </div>
                <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{s.region} • {helpers.getAQICategory(s.aqi)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AQI Legend */}
      <div style={{ background:'white', borderRadius:14, padding:'14px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
        <span style={{ fontSize:13, fontWeight:700, color:'#64748b' }}>AQI Scale:</span>
        {[['0–50','Good','#00E400'],['51–100','Satisfactory','#FFD700'],['101–200','Moderate','#FF7E00'],['201–300','Poor','#FF0000'],['301–400','Very Poor','#8F3F97'],['400+','Severe','#7E0023']].map(([range, label, color]) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
            <div style={{ width:12, height:12, borderRadius:'50%', background:color }} />
            <span style={{ color:'#64748b' }}>{range} <strong>{label}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AQIMap;
