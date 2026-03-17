import React, { useState, useEffect } from 'react';
import PolicyAnalytics from '../components/PolicyAnalytics';
import Recommendations from '../components/Recommendations';
import { aqiAPI } from '../services/api';

const PolicyImpact = () => {
  const [selectedRegion, setSelectedRegion] = useState('Delhi');
  const [activeTab, setActiveTab]           = useState('analytics');
  const [liveAqi, setLiveAqi]               = useState(null);

  useEffect(() => {
    aqiAPI.getLive()
      .then(r => setLiveAqi(r.data?.aqi))
      .catch(() => setLiveAqi(150));
  }, []);

  const regions = ['Delhi','Noida','Gurgaon','Ghaziabad','Faridabad'];

  return (
    <div style={{ padding:32, maxWidth:1600, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:32, flexWrap:'wrap', gap:20 }}>
        <div>
          <h1 style={{ fontSize:32, fontWeight:900, margin:0, color:'#1a1a1a' }}>Policy Impact Assessment</h1>
          <p style={{ color:'#718096', margin:'4px 0 0 0', fontSize:15 }}>
            Track effectiveness and get AI-powered recommendations
            {liveAqi && <span style={{ marginLeft:12, padding:'3px 12px', background:'#eff6ff', color:'#1d4ed8', borderRadius:20, fontWeight:700, fontSize:13 }}>
              Live AQI: {liveAqi}
            </span>}
          </p>
        </div>
        <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} style={{
          padding:'10px 16px', border:'2px solid #e2e8f0', borderRadius:8,
          fontSize:14, fontWeight:600, cursor:'pointer', minWidth:200,
        }}>
          {regions.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:32, background:'#f7fafc', padding:4, borderRadius:12, width:'fit-content' }}>
        {[['analytics','📊 Analytics & History'],['recommendations','💡 AI Recommendations']].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            display:'flex', alignItems:'center', gap:8, padding:'12px 24px',
            background: activeTab === tab ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'transparent',
            color: activeTab === tab ? 'white' : '#4a5568',
            border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:14, transition:'all 0.2s',
          }}>{label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ animation:'fadeIn 0.3s ease-in' }}>
        {activeTab === 'analytics' && <PolicyAnalytics region={selectedRegion} />}
        {activeTab === 'recommendations' && <Recommendations region={selectedRegion} currentAQI={liveAqi || 150} />}
      </div>

      <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
};

export default PolicyImpact;