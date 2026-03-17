import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { forecastAPI, helpers } from '../services/api';

const AQIForecast = ({ stationId, location }) => {
  const [forecast, setForecast]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [viewHours, setViewHours] = useState(24);
  const [error, setError]         = useState(null);

  useEffect(() => { fetchForecast(); }, []);

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await forecastAPI.generate(72);
      setForecast(data);
    } catch (err) {
      console.error('Forecast error:', err);
      setError('Could not generate forecast. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ background:'white', borderRadius:20, padding:40, textAlign:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>
      <div style={{ fontSize:40, marginBottom:12 }}>⏳</div>
      <p style={{ color:'#718096' }}>Building 72-hour AQI forecast from live data...</p>
    </div>
  );

  if (error || !forecast) return (
    <div style={{ background:'white', borderRadius:20, padding:40, textAlign:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>
      <div style={{ fontSize:40, marginBottom:12 }}>📡</div>
      <p style={{ color:'#718096' }}>{error || 'No forecast data available'}</p>
      <button onClick={fetchForecast} style={{ marginTop:16, padding:'10px 24px', background:'#3b82f6', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer' }}>Retry</button>
    </div>
  );

  const chartData = forecast.forecast_hours.slice(0, viewHours).map((h, i) => ({
    ...h,
    label: i % (viewHours === 24 ? 3 : viewHours === 48 ? 6 : 9) === 0 ? h.hour : '',
  }));

  const { summary, current_aqi, city } = forecast;
  const trend = summary.avg > current_aqi ? 'worsen' : summary.avg < current_aqi ? 'improve' : 'stay stable';
  const bestTime = forecast.forecast_hours.slice(0, 24).find(h => h.aqi === summary.min);

  // Custom gradient stops based on AQI bands
  const gradientId = 'aqiAreaGrad';

  return (
    <div style={{ background:'white', borderRadius:20, padding:28, boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:16 }}>
        <div>
          <h2 style={{ fontSize:24, fontWeight:800, margin:0, color:'#1a1a1a' }}>📈 Air Quality Forecast</h2>
          <p style={{ color:'#718096', margin:'4px 0 0 0', fontSize:13 }}>
            📍 {city} • Generated {new Date(forecast.generated_at).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {[24, 48, 72].map(h => (
            <button key={h} onClick={() => setViewHours(h)} style={{
              padding:'8px 18px', borderRadius:10, border:'2px solid',
              fontWeight:700, cursor:'pointer', fontSize:13,
              background: viewHours === h ? '#3b82f6' : 'white',
              color: viewHours === h ? 'white' : '#4a5568',
              borderColor: viewHours === h ? '#3b82f6' : '#e2e8f0',
            }}>{h}h</button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        {[
          { label:'CURRENT', value: current_aqi, color:'#3b82f6', bg:'#eff6ff' },
          { label:'24H AVG', value: summary.avg, color:'#16a34a', bg:'#f0fdf4' },
          { label:`PEAK (${viewHours}H)`, value: summary.max, color:'#ea580c', bg:'#fff7ed' },
          { label:`BEST (${viewHours}H)`, value: summary.min, color:'#8b5cf6', bg:'#f5f3ff' },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, borderRadius:14, padding:'16px 20px' }}>
            <div style={{ fontSize:10, fontWeight:700, color:s.color, letterSpacing:'0.08em', marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:32, fontWeight:900, color:s.color, fontFamily:'monospace' }}>{s.value}</div>
            <div style={{ fontSize:11, color:s.color, marginTop:2 }}>{helpers.getAQICategory(s.value)}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ marginBottom:24 }}>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top:10, right:10, left:0, bottom:0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize:11, fill:'#94a3b8' }} />
            <YAxis domain={['auto','auto']} tick={{ fontSize:11, fill:'#94a3b8' }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{ background:'white', border:`2px solid ${d.color}`, borderRadius:12, padding:'12px 16px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontWeight:800, fontSize:16, color:d.color }}>{d.aqi} AQI</div>
                    <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{d.category}</div>
                    <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>{d.date} {d.hour}</div>
                    <div style={{ fontSize:11, color:'#94a3b8' }}>Confidence: {Math.round(d.confidence)}%</div>
                  </div>
                );
              }}
            />
            <Area type="monotone" dataKey="aqi" stroke="#3b82f6" strokeWidth={3}
              fill={`url(#${gradientId})`} dot={false} activeDot={{ r:5, fill:'#3b82f6' }} name="AQI" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Hourly pills — next 12h */}
      <div style={{ marginBottom:24 }}>
        <h3 style={{ fontSize:15, fontWeight:700, color:'#1a1a1a', marginBottom:12 }}>Next 12 Hours</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
          {forecast.forecast_hours.slice(0, 12).map((h, i) => (
            <div key={i} style={{
              textAlign:'center', padding:'12px 6px', borderRadius:12,
              border:`2px solid ${h.color}25`, background:`${h.color}10`,
            }}>
              <div style={{ fontSize:10, color:'#94a3b8', marginBottom:4 }}>{h.hour}</div>
              <div style={{ fontSize:22, fontWeight:900, color:h.color, fontFamily:'monospace' }}>{h.aqi}</div>
              <div style={{ fontSize:10, color:h.color, fontWeight:600, marginTop:2 }}>{h.category.split(' ')[0]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AQI Legend */}
      <div style={{ background:'#f8fafc', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#64748b', marginBottom:10 }}>AQI SCALE</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {[
            { range:'0–50',   label:'Good',        color:'#00E400' },
            { range:'51–100', label:'Satisfactory', color:'#FFD700' },
            { range:'101–200',label:'Moderate',     color:'#FF7E00' },
            { range:'201–300',label:'Poor',         color:'#FF0000' },
            { range:'301–400',label:'Very Poor',    color:'#8F3F97' },
            { range:'400+',   label:'Severe',       color:'#7E0023' },
          ].map(s => (
            <div key={s.label} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:s.color }} />
              <span style={{ color:'#64748b' }}>{s.range} {s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      <div style={{ background:'#eff6ff', borderLeft:'4px solid #3b82f6', borderRadius:10, padding:'14px 18px' }}>
        <div style={{ fontWeight:700, color:'#1e40af', marginBottom:8, fontSize:14 }}>📊 Key Insights</div>
        <ul style={{ margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:6 }}>
          {[
            `Air quality expected to ${trend} over the next ${viewHours} hours`,
            `Peak pollution: ${summary.max} AQI around ${summary.worst_hour?.hour} on ${summary.worst_hour?.date}`,
            bestTime ? `Best time outdoors: ${bestTime.hour} (AQI ${bestTime.aqi})` : 'Monitor conditions before going outside',
            summary.max > 200 ? '⚠️ High pollution alert — limit outdoor exposure and wear N95 mask' : '✅ Moderate conditions expected — normal precautions advised',
          ].map((tip, i) => (
            <li key={i} style={{ fontSize:13, color:'#1e40af', paddingLeft:16, position:'relative' }}>
              <span style={{ position:'absolute', left:0 }}>•</span>{tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AQIForecast;
