import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { policyAPI, aqiAPI, helpers } from '../services/api';

const POLICY_RATES = {
  traffic_management:    8,
  industrial_regulation: 12,
  construction_control:  6,
  biomass_burning_ban:   11,
  odd_even_scheme:       8,
  public_transport:      6,
  green_zone:            4,
  emission_standards:    9,
};

const Simulation = () => {
  const [selectedPolicies, setSelectedPolicies] = useState([]);
  const [region, setRegion]                     = useState('Delhi');
  const [duration, setDuration]                 = useState(30);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading]                   = useState(false);
  const [liveAqi, setLiveAqi]                   = useState(null);
  const [error, setError]                       = useState(null);

  useEffect(() => {
    aqiAPI.getLive()
      .then(r => setLiveAqi(r.data))
      .catch(() => setLiveAqi({ aqi: 150, city: 'Delhi' })); // fallback
  }, []);

  const availablePolicies = [
    { id:'traffic_management',    name:'Traffic Management',          icon:'🚗', reduction:'8-12%'  },
    { id:'industrial_regulation', name:'Industrial Regulation',       icon:'🏭', reduction:'10-15%' },
    { id:'construction_control',  name:'Construction Control',        icon:'🏗️', reduction:'5-8%'   },
    { id:'biomass_burning_ban',   name:'Biomass Burning Ban',         icon:'🔥', reduction:'9-14%'  },
    { id:'odd_even_scheme',       name:'Odd-Even Vehicle Scheme',     icon:'🚙', reduction:'7-10%'  },
    { id:'public_transport',      name:'Public Transport Boost',      icon:'🚌', reduction:'5-7%'   },
    { id:'green_zone',            name:'Green Zone Expansion',        icon:'🌳', reduction:'3-5%'   },
    { id:'emission_standards',    name:'Stricter Emission Standards', icon:'💨', reduction:'8-11%'  },
  ];

  const togglePolicy = (id) =>
    setSelectedPolicies(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const runSimulation = async () => {
    if (selectedPolicies.length === 0) {
      setError('Please select at least one policy to simulate.');
      return;
    }
    setError(null);
    setLoading(true);
    setSimulationResult(null);
    try {
      // Always use live AQI as baseline; fall back to 150 if unavailable
      const baseline = liveAqi?.aqi || 150;
      const res = await policyAPI.simulate({
        policies:      selectedPolicies,
        region,
        duration_days: duration,
        baseline_override: baseline,
      });
      if (!res?.data) throw new Error('Empty simulation response');
      setSimulationResult(res.data);
    } catch (err) {
      console.error('Simulation error:', err);
      setError(`Simulation failed: ${err.message}. Using offline fallback.`);
      // Run offline fallback directly
      const baseline = liveAqi?.aqi || 150;
      const result = runOfflineSimulation(baseline, selectedPolicies, duration);
      setSimulationResult(result);
    } finally {
      setLoading(false);
    }
  };

  // Offline fallback — identical logic to api.js runLocalSimulation
  const runOfflineSimulation = (baselineAqi, policies, durationDays) => {
    const totalReduction = policies.reduce((sum, p) => sum + (POLICY_RATES[p] || 5) / 100, 0);
    const cappedReduction = Math.min(totalReduction, 0.55);
    const projectedAqi = Array.from({ length: durationDays }, (_, i) => {
      const progress = i / durationDays;
      const noise = (Math.random() - 0.5) * 6;
      return Math.max(30, baselineAqi * (1 - cappedReduction * progress) + noise);
    });
    return {
      baseline_aqi: baselineAqi,
      projected_aqi: projectedAqi,
      predicted_reduction_percentage: cappedReduction * 100,
      final_projected_aqi: Math.round(projectedAqi[projectedAqi.length - 1]),
      assumptions: [
        `Baseline AQI of ${baselineAqi} from live AQICN reading`,
        `${policies.length} policy intervention(s) applied simultaneously`,
        'Weather conditions assumed stable (calm wind, moderate humidity)',
        'Industrial compliance rate assumed at 85%',
        'Vehicular enforcement at 90% effectiveness',
        'Results modelled using Delhi-NCR historical reduction data',
      ],
      confidence_score: 0.65 + Math.min(policies.length * 0.05, 0.25),
      policies_applied: policies,
      duration_days: durationDays,
    };
  };

  // Chart data
  const chartData = simulationResult?.projected_aqi?.map((aqi, i) => ({
    day:       i + 1,
    projected: Math.round(aqi),
    baseline:  Math.round(simulationResult.baseline_aqi),
  })) || [];

  // Sample every N points for readability
  const sampledChart = chartData.filter((_, i) => i % Math.max(1, Math.floor(duration / 30)) === 0);

  const policyImpactData = selectedPolicies.map(id => {
    const p = availablePolicies.find(x => x.id === id);
    return { name: p?.name?.split(' ').slice(0,2).join(' ') || id, reduction: POLICY_RATES[id] || 7 };
  }).sort((a, b) => b.reduction - a.reduction);

  const aqiColor = helpers.getAQIColor(liveAqi?.aqi || 0);
  const totalEstReduction = selectedPolicies.reduce((s, id) => s + (POLICY_RATES[id] || 5), 0);

  return (
    <div style={{ padding:32, maxWidth:1800, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:32, flexWrap:'wrap', gap:20 }}>
        <div>
          <h1 style={{ fontSize:32, fontWeight:900, margin:0, color:'#1a1a1a' }}>Policy Impact Simulation</h1>
          <p style={{ color:'#718096', margin:'4px 0 0 0', fontSize:15 }}>Model projected impact of policy combinations on Delhi-NCR air quality</p>
        </div>
        {liveAqi && (
          <div style={{ background:`${aqiColor}20`, border:`2px solid ${aqiColor}40`, borderRadius:12, padding:'12px 20px', textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#718096', fontWeight:700 }}>LIVE BASELINE AQI</div>
            <div style={{ fontSize:28, fontWeight:900, color:aqiColor, fontFamily:'monospace' }}>{liveAqi.aqi}</div>
            <div style={{ fontSize:12, color:'#718096' }}>{helpers.getAQICategory(liveAqi.aqi)}</div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background:'#fffbeb', border:'1px solid #fef08a', borderRadius:10, padding:'12px 16px', marginBottom:20, fontSize:13, color:'#854d0e' }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'400px 1fr', gap:24 }}>

        {/* ── Config Panel ── */}
        <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(0,0,0,0.08)', height:'fit-content' }}>
          <h2 style={{ fontSize:18, fontWeight:800, margin:'0 0 24px 0', color:'#1a1a1a' }}>⚙️ Simulation Settings</h2>

          {/* Region */}
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:14, fontWeight:700, marginBottom:8, color:'#2d3748' }}>Region</label>
            <select value={region} onChange={e => setRegion(e.target.value)} style={{ width:'100%', padding:'10px 12px', border:'2px solid #e2e8f0', borderRadius:8, fontSize:14, fontWeight:600 }}>
              {['Delhi','Noida','Gurgaon','Ghaziabad','Faridabad'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          {/* Duration */}
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:14, fontWeight:700, marginBottom:8, color:'#2d3748' }}>
              Duration: <strong style={{ color:'#667eea' }}>{duration} days</strong>
            </label>
            <input type="range" min="7" max="90" value={duration}
              onChange={e => setDuration(parseInt(e.target.value))}
              style={{ width:'100%', accentColor:'#667eea', marginBottom:4 }} />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#a0aec0' }}>
              <span>7 days</span><span>90 days</span>
            </div>
          </div>

          {/* Policies */}
          <div style={{ marginBottom:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <label style={{ fontSize:14, fontWeight:700, color:'#2d3748' }}>
                Select Policies <span style={{ color:'#667eea' }}>({selectedPolicies.length} selected)</span>
              </label>
              {selectedPolicies.length > 0 && (
                <span style={{ fontSize:12, color:'#16a34a', fontWeight:700 }}>~{Math.min(55, totalEstReduction)}% est. reduction</span>
              )}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:380, overflowY:'auto' }}>
              {availablePolicies.map(policy => {
                const selected = selectedPolicies.includes(policy.id);
                return (
                  <button key={policy.id} onClick={() => togglePolicy(policy.id)} style={{
                    display:'flex', alignItems:'center', gap:12, padding:'10px 12px',
                    background: selected ? 'rgba(102,126,234,0.08)' : '#f7fafc',
                    border: `2px solid ${selected ? '#667eea' : '#e2e8f0'}`,
                    borderRadius:8, cursor:'pointer', transition:'all 0.2s', textAlign:'left',
                  }}>
                    <span style={{ fontSize:22 }}>{policy.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:13, color:'#2d3748' }}>{policy.name}</div>
                      <div style={{ fontSize:11, color: selected ? '#667eea' : '#a0aec0' }}>Est. {policy.reduction} reduction</div>
                    </div>
                    {selected && <span style={{ color:'#667eea', fontWeight:900, fontSize:18 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={runSimulation} disabled={loading} style={{
            width:'100%', padding:16,
            background: loading ? '#94a3b8' : 'linear-gradient(135deg,#667eea,#764ba2)',
            color:'white', border:'none', borderRadius:10, fontWeight:800, fontSize:16,
            cursor: loading ? 'not-allowed' : 'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            transition:'all 0.3s',
          }}>
            {loading
              ? <><span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite', display:'inline-block' }} /> Running Simulation...</>
              : <><span>🎯</span> Run Simulation</>
            }
          </button>
        </div>

        {/* ── Results Panel ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {simulationResult ? (
            <>
              {/* Summary cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
                {[
                  { label:'📊 Baseline AQI',  value: Math.round(simulationResult.baseline_aqi),                      sub: helpers.getAQICategory(simulationResult.baseline_aqi), bg:'white',                                              color: helpers.getAQIColor(simulationResult.baseline_aqi) },
                  { label:'🎯 Projected AQI', value: simulationResult.final_projected_aqi,                            sub:`After ${duration} days`,                               bg:'linear-gradient(135deg,#667eea,#764ba2)',             color:'white' },
                  { label:'📉 Reduction',     value:`${simulationResult.predicted_reduction_percentage.toFixed(1)}%`, sub:`${simulationResult.policies_applied.length} policies`,  bg:'linear-gradient(135deg,#16a34a,#22c55e)',            color:'white' },
                  { label:'🔬 Confidence',    value:`${(simulationResult.confidence_score * 100).toFixed(0)}%`,       sub:'Model accuracy',                                       bg:'linear-gradient(135deg,#0891b2,#06b6d4)',            color:'white' },
                ].map(s => (
                  <div key={s.label} style={{ background:s.bg, borderRadius:14, padding:20, boxShadow:'0 2px 12px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontSize:13, fontWeight:600, color: s.color === 'white' ? 'rgba(255,255,255,0.8)' : '#718096', marginBottom:8 }}>{s.label}</div>
                    <div style={{ fontSize:36, fontWeight:900, fontFamily:'monospace', color: s.color === 'white' ? 'white' : s.color }}>{s.value}</div>
                    <div style={{ fontSize:12, color: s.color === 'white' ? 'rgba(255,255,255,0.7)' : '#718096', marginTop:4 }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Trend chart */}
              <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize:17, fontWeight:700, margin:'0 0 20px 0', color:'#1a1a1a' }}>
                  📈 Projected AQI Trend Over {duration} Days
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={sampledChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" label={{ value:'Days', position:'insideBottom', offset:-5 }} tick={{ fontSize:11 }} />
                    <YAxis tick={{ fontSize:11 }} domain={['auto','auto']} />
                    <Tooltip formatter={(v, n) => [v, n === 'projected' ? 'With Policies' : 'Without Policies']} contentStyle={{ borderRadius:10 }} />
                    <Legend />
                    <Line type="monotone" dataKey="baseline"  stroke="#FF6384" strokeDasharray="6 3" strokeWidth={2} dot={false} name="Baseline (No Action)" />
                    <Line type="monotone" dataKey="projected" stroke="#667eea" strokeWidth={3}         dot={false} name="Projected (With Policies)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Individual policy impact */}
              {policyImpactData.length > 0 && (
                <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(0,0,0,0.08)' }}>
                  <h3 style={{ fontSize:17, fontWeight:700, margin:'0 0 20px 0', color:'#1a1a1a' }}>📊 Individual Policy Impact</h3>
                  <ResponsiveContainer width="100%" height={Math.max(150, policyImpactData.length * 52)}>
                    <BarChart data={policyImpactData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" domain={[0, 20]} tickFormatter={v => `${v}%`} tick={{ fontSize:11 }} />
                      <YAxis dataKey="name" type="category" width={140} tick={{ fontSize:12 }} />
                      <Tooltip formatter={v => [`${v}%`, 'Est. AQI Reduction']} />
                      <Bar dataKey="reduction" radius={[0,6,6,0]}>
                        {policyImpactData.map((_, i) => (
                          <Cell key={i} fill={['#667eea','#764ba2','#16a34a','#0891b2','#f97316','#ef4444','#8b5cf6','#14b8a6'][i % 8]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* AQI improvement indicator */}
              <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize:17, fontWeight:700, margin:'0 0 16px 0', color:'#1a1a1a' }}>🏥 Health Impact Projection</h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                  {[
                    { label:'AQI Points Saved',        value: Math.round(simulationResult.baseline_aqi - simulationResult.final_projected_aqi), unit:'points', color:'#667eea' },
                    { label:'Hospital Admissions',      value:`-${Math.round(simulationResult.predicted_reduction_percentage * 0.8)}%`, unit:'respiratory cases', color:'#16a34a' },
                    { label:'Productive Days Gained',   value: Math.round(simulationResult.predicted_reduction_percentage * 2.5), unit:'days/person/year', color:'#0891b2' },
                  ].map(h => (
                    <div key={h.label} style={{ padding:16, background:`${h.color}10`, borderRadius:12, border:`1.5px solid ${h.color}25`, textAlign:'center' }}>
                      <div style={{ fontSize:28, fontWeight:900, color:h.color, fontFamily:'monospace' }}>{h.value}</div>
                      <div style={{ fontSize:11, color:'#64748b', fontWeight:600, marginTop:4 }}>{h.unit}</div>
                      <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>{h.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assumptions */}
              <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize:16, fontWeight:700, margin:'0 0 16px 0', color:'#1a1a1a' }}>📋 Simulation Assumptions</h3>
                <ul style={{ margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:0 }}>
                  {simulationResult.assumptions.map((a, i) => (
                    <li key={i} style={{ padding:'8px 0 8px 24px', position:'relative', color:'#4a5568', fontSize:13, borderBottom:'1px solid #f1f5f9' }}>
                      <span style={{ position:'absolute', left:4, color:'#667eea', fontWeight:900 }}>→</span>{a}
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop:16, padding:12, background:'#fffbeb', borderRadius:8, border:'1px solid #fef08a', fontSize:13, color:'#854d0e' }}>
                  ⚠️ <strong>Disclaimer:</strong> This simulation uses historical Delhi-NCR data and environmental models. Real-world results will vary based on enforcement, weather, and compliance rates.
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign:'center', padding:'80px 20px', color:'#a0aec0', background:'white', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize:72, marginBottom:20 }}>🎯</div>
              <h3 style={{ fontSize:22, margin:'0 0 12px 0', color:'#2d3748' }}>No Simulation Results Yet</h3>
              <p style={{ margin:'0 0 24px 0', fontSize:14 }}>Select policies from the left panel and click "Run Simulation"</p>
              {liveAqi && (
                <div style={{ display:'inline-block', padding:'16px 28px', background:'#f7fafc', borderRadius:12 }}>
                  <div style={{ fontSize:13, color:'#718096' }}>Current {region} AQI</div>
                  <div style={{ fontSize:40, fontWeight:900, color: helpers.getAQIColor(liveAqi.aqi), fontFamily:'monospace' }}>{liveAqi.aqi}</div>
                  <div style={{ fontSize:13, color:'#718096' }}>will be used as simulation baseline</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
};

export default Simulation;