import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { sourceAPI, helpers } from '../services/api';

const SourceAnalysis = () => {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [region, setRegion]     = useState('Delhi');
  const [timeRange, setTimeRange] = useState('Current');

  useEffect(() => { fetchData(); }, [region]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await sourceAPI.getBreakdown({ region });
      setData(res.data);
    } catch (err) {
      console.error('Source analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6'];

  const interventions = data ? [
    { source:'Vehicular Emissions', action:'Odd-Even scheme, CNG mandate, EV push',           impact:'High',   reduction:'8-12%' },
    { source:'Industrial Activity',  action:'Emission audits, stack scrubbers, green zones',  impact:'High',   reduction:'10-15%' },
    { source:'Construction Dust',    action:'Water sprinklers, dust barriers, fines',          impact:'Medium', reduction:'5-8%' },
    { source:'Biomass Burning',      action:'Biomass ban enforcement, alternative fuel scheme',impact:'High',   reduction:'9-14%' },
    { source:'Other Sources',        action:'Waste burning ban, road sweeping, green buffers', impact:'Low',    reduction:'3-5%' },
  ] : [];

  const impactColor = { High:'#ef4444', Medium:'#f97316', Low:'#16a34a' };

  return (
    <div className="source-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pollution Source Analysis</h1>
          <p className="page-subtitle">Identify and quantify pollution sources for targeted policy interventions</p>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <select value={region} onChange={e => setRegion(e.target.value)} className="filter-select">
            {['Delhi','Noida','Gurgaon','Ghaziabad','Faridabad'].map(r => <option key={r}>{r}</option>)}
          </select>
          <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className="filter-select">
            {['Current','Last 7 Days','Last 30 Days'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:60 }}>
          <div style={{ fontSize:48 }}>🔬</div>
          <p style={{ color:'#718096', marginTop:16 }}>Analyzing pollution sources from live data...</p>
        </div>
      ) : data ? (
        <>
          {/* AQI Context */}
          <div style={{ background:`${helpers.getAQIColor(data.current_aqi)}12`, border:`2px solid ${helpers.getAQIColor(data.current_aqi)}30`, borderRadius:16, padding:'16px 24px', marginBottom:24, display:'flex', alignItems:'center', gap:20 }}>
            <div style={{ fontSize:48, fontWeight:900, color:helpers.getAQIColor(data.current_aqi), fontFamily:'monospace' }}>{data.current_aqi}</div>
            <div>
              <div style={{ fontWeight:800, color:'#1a1a1a' }}>Current AQI — {helpers.getAQICategory(data.current_aqi)}</div>
              <div style={{ fontSize:13, color:'#718096' }}>{data.city} • {data.timestamp}</div>
              <div style={{ fontSize:13, color:'#64748b', marginTop:4 }}>Source breakdown computed from real-time pollutant concentrations (PM2.5, PM10, NO₂, SO₂, CO)</div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24 }}>
            {/* Pie Chart */}
            <div className="chart-card">
              <h3 className="chart-title">🥧 Source Contribution Breakdown</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={data.sources} cx="50%" cy="50%" outerRadius={100} dataKey="contribution"
                    label={({ source, contribution }) => `${source.split(' ')[0]}: ${contribution}%`}
                    labelLine={false}>
                    {data.sources.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n, p) => [`${v}%`, p.payload.source]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div className="chart-card">
              <h3 className="chart-title">📊 Contribution by Source (%)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.sources} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0,50]} tickFormatter={v=>`${v}%`} tick={{ fontSize:11 }} />
                  <YAxis dataKey="source" type="category" width={130} tick={{ fontSize:11 }} />
                  <Tooltip formatter={v => [`${v}%`, 'Contribution']} />
                  <Bar dataKey="contribution" radius={[0,6,6,0]}>
                    {data.sources.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Source Cards */}
          <div className="chart-card" style={{ marginBottom:24 }}>
            <h3 className="chart-title">📋 Source Details & Policy Interventions</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
              {data.sources.map((s, i) => {
                const intervention = interventions.find(x => x.source === s.source) || {};
                return (
                  <div key={s.source} style={{
                    padding:20, borderRadius:12, border:`1.5px solid ${COLORS[i]}30`,
                    borderLeft:`4px solid ${COLORS[i]}`, background:`${COLORS[i]}08`,
                  }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                      <div style={{ fontWeight:800, color:'#1a1a1a', fontSize:15 }}>{s.source}</div>
                      <div style={{ fontSize:24, fontWeight:900, color:COLORS[i], fontFamily:'monospace' }}>{s.contribution}%</div>
                    </div>
                    <div style={{ height:6, background:'#e2e8f0', borderRadius:3, overflow:'hidden', marginBottom:12 }}>
                      <div style={{ height:'100%', width:`${s.contribution * 2}%`, background:COLORS[i], borderRadius:3 }} />
                    </div>
                    {intervention.action && (
                      <div style={{ fontSize:12, color:'#64748b', lineHeight:1.5 }}>
                        <strong>🎯 Action:</strong> {intervention.action}
                      </div>
                    )}
                    {intervention.impact && (
                      <div style={{ marginTop:8, display:'flex', justifyContent:'space-between', fontSize:12 }}>
                        <span style={{ padding:'3px 10px', background:`${impactColor[intervention.impact]}15`, color:impactColor[intervention.impact], borderRadius:20, fontWeight:700 }}>
                          {intervention.impact} Impact
                        </span>
                        <span style={{ color:'#16a34a', fontWeight:700 }}>Est. {intervention.reduction}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data Note */}
          <div style={{ padding:'16px 20px', background:'#f8fafc', borderRadius:12, border:'1px solid #e2e8f0', fontSize:13, color:'#64748b' }}>
            ℹ️ <strong>Methodology:</strong> Source contributions are estimated from real-time pollutant ratios (PM2.5, PM10, NO₂, SO₂, CO) from the AQICN monitoring station at {data.city}. 
            These are approximations based on Delhi-NCR emission factor databases. For precise source apportionment, receptor modeling (PMF/CMB) with multiple stations is recommended.
          </div>
        </>
      ) : (
        <div style={{ textAlign:'center', padding:60, background:'white', borderRadius:16 }}>
          <div style={{ fontSize:48 }}>❌</div>
          <p style={{ color:'#718096' }}>Could not load data. Make sure the backend is running at localhost:8000</p>
          <button onClick={fetchData} style={{ marginTop:16, padding:'10px 24px', background:'#667eea', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>Retry</button>
        </div>
      )}

      <style jsx>{`
        .source-page { padding:32px; max-width:1800px; margin:0 auto; }
        .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; flex-wrap:wrap; gap:20px; }
        .page-title { font-size:32px; font-weight:900; margin:0; color:#1a1a1a; }
        .page-subtitle { color:#718096; margin:4px 0 0 0; font-size:15px; }
        .filter-select { padding:10px 14px; border:2px solid #e2e8f0; border-radius:8px; font-size:14px; font-weight:600; background:white; cursor:pointer; }
        .filter-select:focus { outline:none; border-color:#667eea; }
        .chart-card { background:white; border-radius:16px; padding:24px; box-shadow:0 2px 12px rgba(0,0,0,0.07); }
        .chart-title { font-size:17px; font-weight:800; margin:0 0 20px 0; color:#1a1a1a; }
        @media(max-width:1024px) { .source-page { padding:16px; } }
      `}</style>
    </div>
  );
};

export default SourceAnalysis;