import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';

const Simulation = () => {
  const [selectedPolicies, setSelectedPolicies] = useState([]);
  const [region, setRegion] = useState('Delhi');
  const [duration, setDuration] = useState(30);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const availablePolicies = [
    { id: 'traffic_management', name: 'Traffic Management', icon: '🚗' },
    { id: 'industrial_regulation', name: 'Industrial Regulation', icon: '🏭' },
    { id: 'construction_control', name: 'Construction Control', icon: '🏗️' },
    { id: 'biomass_burning_ban', name: 'Biomass Burning Ban', icon: '🔥' },
    { id: 'odd_even_scheme', name: 'Odd-Even Scheme', icon: '🚙' },
    { id: 'public_transport', name: 'Public Transport Enhancement', icon: '🚌' },
    { id: 'green_zone', name: 'Green Zone Expansion', icon: '🌳' },
    { id: 'emission_standards', name: 'Emission Standards', icon: '💨' },
  ];

  const togglePolicy = (policyId) => {
    setSelectedPolicies(prev => 
      prev.includes(policyId) 
        ? prev.filter(id => id !== policyId)
        : [...prev, policyId]
    );
  };

  const runSimulation = async () => {
    if (selectedPolicies.length === 0) {
      alert('Please select at least one policy to simulate');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/policy/simulate', {
        policies: selectedPolicies,
        region,
        duration_days: duration
      });
      setSimulationResult(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error running simulation:', error);
      setLoading(false);
    }
  };

  const chartData = simulationResult?.projected_aqi?.map((aqi, index) => ({
    day: index + 1,
    aqi: aqi,
    baseline: simulationResult.baseline_aqi
  })) || [];

  return (
    <div className="simulation-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Policy Impact Simulation</h1>
          <p className="page-subtitle">Model the projected impact of policy combinations</p>
        </div>
      </div>

      <div className="simulation-grid">
        {/* Configuration Panel */}
        <div className="config-panel">
          <div className="panel-card">
            <h2 className="panel-title">Simulation Settings</h2>

            {/* Region */}
            <div className="form-group">
              <label>Region</label>
              <select value={region} onChange={(e) => setRegion(e.target.value)} className="form-select">
                <option value="Delhi">Delhi</option>
                <option value="Noida">Noida</option>
                <option value="Gurgaon">Gurgaon</option>
                <option value="Ghaziabad">Ghaziabad</option>
                <option value="Faridabad">Faridabad</option>
              </select>
            </div>

            {/* Duration */}
            <div className="form-group">
              <label>Duration (days)</label>
              <input 
                type="range" 
                min="7" 
                max="90" 
                value={duration} 
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="range-slider"
              />
              <span className="duration-display">{duration} days</span>
            </div>

            {/* Policy Selection */}
            <div className="form-group">
              <label>Select Policies ({selectedPolicies.length} selected)</label>
              <div className="policy-grid">
                {availablePolicies.map(policy => (
                  <button
                    key={policy.id}
                    className={`policy-btn ${selectedPolicies.includes(policy.id) ? 'selected' : ''}`}
                    onClick={() => togglePolicy(policy.id)}
                  >
                    <span className="policy-icon">{policy.icon}</span>
                    <span className="policy-name">{policy.name}</span>
                    {selectedPolicies.includes(policy.id) && <span className="check">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Run Button */}
            <button onClick={runSimulation} disabled={loading} className="run-btn">
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Running Simulation...
                </>
              ) : (
                <>
                  <span>🎯</span>
                  Run Simulation
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="results-panel">
          {simulationResult ? (
            <>
              {/* Summary Cards */}
              <div className="summary-cards">
                <div className="summary-card">
                  <h3>Baseline AQI</h3>
                  <div className="summary-value">{Math.round(simulationResult.baseline_aqi)}</div>
                </div>
                <div className="summary-card highlight">
                  <h3>Projected AQI</h3>
                  <div className="summary-value">
                    {Math.round(simulationResult.projected_aqi[simulationResult.projected_aqi.length - 1])}
                  </div>
                </div>
                <div className="summary-card success">
                  <h3>Reduction</h3>
                  <div className="summary-value">
                    {simulationResult.predicted_reduction_percentage.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="chart-card">
                <h3 className="chart-title">Projected AQI Trend</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" label={{ value: 'Days', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'AQI', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="baseline" stroke="#FF6384" name="Baseline" strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="aqi" stroke="#667eea" strokeWidth={3} name="Projected" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Assumptions */}
              <div className="assumptions-card">
                <h3>Simulation Assumptions</h3>
                <ul>
                  {simulationResult.assumptions.map((assumption, index) => (
                    <li key={index}>{assumption}</li>
                  ))}
                </ul>
                <div className="confidence-score">
                  <span>Confidence Score:</span>
                  <strong>{(simulationResult.confidence_score * 100).toFixed(0)}%</strong>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">🎯</span>
              <h3>No Simulation Results Yet</h3>
              <p>Configure your simulation parameters and click "Run Simulation" to see projected impacts</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .simulation-page {
          padding: 32px;
          max-width: 1800px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 32px;
        }

        .page-title {
          font-size: 32px;
          font-weight: 900;
          margin: 0;
          color: #1a1a1a;
        }

        .page-subtitle {
          color: #718096;
          margin: 4px 0 0 0;
          font-size: 15px;
        }

        .simulation-grid {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 24px;
        }

        .panel-card,
        .chart-card,
        .assumptions-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .panel-title {
          font-size: 20px;
          font-weight: 800;
          margin: 0 0 24px 0;
          color: #1a1a1a;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #2d3748;
        }

        .form-select {
          width: 100%;
          padding: 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
        }

        .form-select:focus {
          outline: none;
          border-color: #667eea;
        }

        .range-slider {
          width: 100%;
          margin-bottom: 8px;
        }

        .duration-display {
          display: block;
          text-align: center;
          font-weight: 700;
          color: #667eea;
          font-size: 18px;
        }

        .policy-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 400px;
          overflow-y: auto;
        }

        .policy-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          position: relative;
        }

        .policy-btn:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
        }

        .policy-btn.selected {
          background: rgba(102, 126, 234, 0.1);
          border-color: #667eea;
        }

        .policy-icon {
          font-size: 24px;
        }

        .policy-name {
          flex: 1;
          font-weight: 600;
          font-size: 13px;
          color: #2d3748;
        }

        .check {
          color: #667eea;
          font-weight: 900;
          font-size: 18px;
        }

        .run-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .run-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .run-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .results-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .summary-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .summary-card.highlight {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .summary-card.success {
          background: linear-gradient(135deg, #00E400 0%, #00FF00 100%);
          color: white;
        }

        .summary-card h3 {
          font-size: 13px;
          margin: 0 0 8px 0;
          opacity: 0.8;
          font-weight: 600;
        }

        .summary-value {
          font-size: 36px;
          font-weight: 900;
          font-family: 'Space Mono', monospace;
        }

        .chart-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 20px 0;
          color: #1a1a1a;
        }

        .assumptions-card h3 {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 16px 0;
          color: #1a1a1a;
        }

        .assumptions-card ul {
          list-style: none;
          padding: 0;
          margin: 0 0 16px 0;
        }

        .assumptions-card li {
          padding: 8px 0 8px 24px;
          position: relative;
          color: #4a5568;
          font-size: 14px;
        }

        .assumptions-card li::before {
          content: '•';
          position: absolute;
          left: 8px;
          color: #667eea;
          font-weight: 900;
        }

        .confidence-score {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f7fafc;
          border-radius: 8px;
          font-size: 14px;
        }

        .confidence-score strong {
          color: #667eea;
          font-size: 18px;
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          color: #a0aec0;
        }

        .empty-icon {
          font-size: 80px;
          display: block;
          margin-bottom: 20px;
        }

        .empty-state h3 {
          font-size: 24px;
          margin: 0 0 12px 0;
          color: #2d3748;
        }

        .empty-state p {
          margin: 0;
          font-size: 15px;
        }

        @media (max-width: 1200px) {
          .simulation-grid {
            grid-template-columns: 1fr;
          }

          .summary-cards {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .simulation-page {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default Simulation;