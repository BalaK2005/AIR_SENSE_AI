import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api } from '../services/api';

const SourceAttribution = ({ region = 'Delhi' }) => {
  const [sourceData, setSourceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('breakdown'); // breakdown, temporal, comparison

  useEffect(() => {
    fetchSourceData();
  }, [region]);

  const fetchSourceData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/source/breakdown', {
        params: { region }
      });
      setSourceData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching source data:', error);
      setLoading(false);
    }
  };

  const COLORS = {
    'Vehicular Emissions': '#FF6384',
    'Industrial Emissions': '#36A2EB',
    'Biomass Burning': '#FFCE56',
    'Construction Dust': '#4BC0C0',
    'Road Dust': '#9966FF',
    'Power Plants': '#FF9F40',
    'Waste Burning': '#FF6384',
    'Other': '#C9CBCF'
  };

  const formatSourceName = (name) => {
    return name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getTrendIcon = (trend) => {
    if (trend === 'increasing') return '📈';
    if (trend === 'decreasing') return '📉';
    return '➡️';
  };

  if (loading) {
    return <div className="loading">Loading source attribution data...</div>;
  }

  if (!sourceData || !sourceData.sources) {
    return <div className="no-data">No source attribution data available</div>;
  }

  const pieData = sourceData.sources.map(source => ({
    name: formatSourceName(source.source),
    value: source.percentage,
    contribution: source.contribution_ug_m3
  }));

  const barData = sourceData.sources.map(source => ({
    name: formatSourceName(source.source).split(' ').slice(0, 2).join(' '),
    percentage: source.percentage,
    contribution: source.contribution_ug_m3
  }));

  return (
    <div className="source-attribution-container">
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">Pollution Source Attribution</h2>
          <p className="section-subtitle">
            {region} - Total AQI: <strong>{sourceData.total_aqi}</strong>
          </p>
        </div>

        <div className="view-toggle">
          <button 
            className={viewMode === 'breakdown' ? 'active' : ''}
            onClick={() => setViewMode('breakdown')}
          >
            📊 Breakdown
          </button>
          <button 
            className={viewMode === 'temporal' ? 'active' : ''}
            onClick={() => setViewMode('temporal')}
          >
            📈 Trends
          </button>
        </div>
      </div>

      {viewMode === 'breakdown' && (
        <div className="breakdown-view">
          {/* Charts */}
          <div className="charts-grid">
            {/* Pie Chart */}
            <div className="chart-card">
              <h3 className="chart-title">Source Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name.split(' ')[0]}: ${percentage.toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#999'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div className="chart-card">
              <h3 className="chart-title">Contribution Levels</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="#667eea" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Source Cards */}
          <div className="sources-grid">
            {sourceData.sources.map((source, index) => (
              <div key={index} className="source-card">
                <div className="source-header">
                  <div 
                    className="source-color" 
                    style={{ backgroundColor: COLORS[formatSourceName(source.source)] || '#999' }}
                  />
                  <h4>{formatSourceName(source.source)}</h4>
                </div>

                <div className="source-metrics">
                  <div className="metric">
                    <span className="metric-value">{source.percentage.toFixed(1)}%</span>
                    <span className="metric-label">of Total</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">{source.contribution_ug_m3.toFixed(1)}</span>
                    <span className="metric-label">µg/m³</span>
                  </div>
                </div>

                <div className="source-trend">
                  <span className="trend-icon">{getTrendIcon(source.trend)}</span>
                  <span className="trend-text">{source.trend}</span>
                </div>

                {index === 0 && (
                  <div className="dominant-badge">Dominant Source</div>
                )}
              </div>
            ))}
          </div>

          {/* Insights */}
          <div className="insights-card">
            <h3>Key Insights</h3>
            <ul className="insights-list">
              <li>
                <strong>{sourceData.dominant_source}</strong> is the primary pollution source at {sourceData.sources[0].percentage.toFixed(1)}%
              </li>
              <li>
                Top 3 sources account for {
                  sourceData.sources.slice(0, 3).reduce((sum, s) => sum + s.percentage, 0).toFixed(1)
                }% of total pollution
              </li>
              <li>
                Focus areas: Implement targeted policies for {
                  sourceData.sources.slice(0, 2).map(s => formatSourceName(s.source)).join(' and ')
                }
              </li>
            </ul>
          </div>
        </div>
      )}

      <style jsx>{`
        .source-attribution-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
        }

        .section-title {
          font-size: 24px;
          font-weight: 800;
          margin: 0;
          color: #1a1a1a;
        }

        .section-subtitle {
          color: #718096;
          margin: 4px 0 0 0;
          font-size: 14px;
        }

        .view-toggle {
          display: flex;
          gap: 8px;
          background: #f7fafc;
          padding: 4px;
          border-radius: 10px;
        }

        .view-toggle button {
          padding: 8px 16px;
          background: transparent;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          color: #4a5568;
          font-size: 13px;
        }

        .view-toggle button:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        .view-toggle button.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .breakdown-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
        }

        .chart-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .chart-title {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 20px 0;
          color: #1a1a1a;
        }

        .sources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .source-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.3s;
          position: relative;
        }

        .source-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .source-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .source-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .source-header h4 {
          font-size: 14px;
          font-weight: 700;
          margin: 0;
          color: #1a1a1a;
        }

        .source-metrics {
          display: flex;
          gap: 20px;
          margin-bottom: 12px;
        }

        .metric {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metric-value {
          font-size: 24px;
          font-weight: 800;
          color: #1a1a1a;
          font-family: 'Space Mono', monospace;
        }

        .metric-label {
          font-size: 11px;
          color: #a0aec0;
          font-weight: 600;
        }

        .source-trend {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #f7fafc;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #4a5568;
        }

        .trend-icon {
          font-size: 16px;
        }

        .dominant-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 4px 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .insights-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
        }

        .insights-card h3 {
          font-size: 20px;
          font-weight: 800;
          margin: 0 0 16px 0;
        }

        .insights-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .insights-list li {
          padding-left: 28px;
          position: relative;
          line-height: 1.6;
        }

        .insights-list li::before {
          content: '💡';
          position: absolute;
          left: 0;
        }

        .loading,
        .no-data {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          color: #718096;
        }

        @media (max-width: 768px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }

          .sources-grid {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default SourceAttribution;