import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api } from '../services/api';

const PolicyAnalytics = ({ region }) => {
  const [analytics, setAnalytics] = useState(null);
  const [policyHistory, setPolicyHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, 1y

  useEffect(() => {
    fetchAnalytics();
    fetchPolicyHistory();
  }, [region, timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/policy/effectiveness', {
        params: { region }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchPolicyHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/policy/history', {
        params: { region }
      });
      setPolicyHistory(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching policy history:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': '#00E400',
      'completed': '#4A90E2',
      'suspended': '#FFD700',
      'cancelled': '#FF0000'
    };
    return colors[status] || '#718096';
  };

  const getEffectivenessColor = (reduction) => {
    if (reduction >= 20) return '#00E400';
    if (reduction >= 10) return '#FFFF00';
    if (reduction >= 5) return '#FF7E00';
    if (reduction > 0) return '#FF6384';
    return '#FF0000';
  };

  if (loading) {
    return <div className="loading">Loading policy analytics...</div>;
  }

  return (
    <div className="policy-analytics-container">
      {/* Header */}
      <div className="analytics-header">
        <h2 className="section-title">Policy Impact Analytics</h2>
        
        <div className="time-selector">
          {['7d', '30d', '90d', '1y'].map(range => (
            <button
              key={range}
              className={`time-btn ${timeRange === range ? 'active' : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      {analytics && (
        <div className="summary-grid">
          <div className="summary-card">
            <div className="card-icon">📋</div>
            <div className="card-content">
              <h3>{analytics.total_policies}</h3>
              <p>Total Policies</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon">✅</div>
            <div className="card-content">
              <h3>{analytics.successful_policies}</h3>
              <p>Successful</p>
              <span className="success-rate">
                {((analytics.successful_policies / analytics.total_policies) * 100).toFixed(1)}% success rate
              </span>
            </div>
          </div>

          <div className="summary-card highlight">
            <div className="card-icon">📉</div>
            <div className="card-content">
              <h3>{analytics.avg_reduction_percentage?.toFixed(1)}%</h3>
              <p>Avg AQI Reduction</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon">🎯</div>
            <div className="card-content">
              <h3>{analytics.max_reduction_percentage?.toFixed(1)}%</h3>
              <p>Best Result</p>
            </div>
          </div>
        </div>
      )}

      {/* Policy History Table */}
      <div className="policy-history-section">
        <h3 className="subsection-title">Recent Policy Implementations</h3>
        
        <div className="table-container">
          <table className="policy-table">
            <thead>
              <tr>
                <th>Policy Name</th>
                <th>Category</th>
                <th>Implemented</th>
                <th>AQI Before</th>
                <th>AQI After</th>
                <th>Reduction</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {policyHistory.slice(0, 10).map((policy, index) => {
                const reduction = policy.reduction_percentage || 0;
                
                return (
                  <tr key={policy.policy_id || index}>
                    <td className="policy-name">{policy.policy_name}</td>
                    <td>
                      <span className="category-badge">{policy.category}</span>
                    </td>
                    <td className="date-cell">
                      {new Date(policy.implemented_date).toLocaleDateString()}
                    </td>
                    <td className="aqi-cell">{policy.aqi_before?.toFixed(0) || 'N/A'}</td>
                    <td className="aqi-cell">{policy.aqi_after?.toFixed(0) || 'N/A'}</td>
                    <td>
                      <span 
                        className="reduction-badge"
                        style={{ 
                          backgroundColor: getEffectivenessColor(reduction) + '20',
                          color: getEffectivenessColor(reduction)
                        }}
                      >
                        {reduction > 0 ? '↓' : '↑'} {Math.abs(reduction).toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span 
                        className="status-dot"
                        style={{ backgroundColor: getStatusColor(policy.status) }}
                      />
                      {policy.status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Effectiveness Chart */}
      {analytics && (
        <div className="chart-section">
          <h3 className="subsection-title">Effectiveness by Category</h3>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { category: 'Traffic', reduction: 15.5 },
                { category: 'Industrial', reduction: 22.3 },
                { category: 'Construction', reduction: 12.8 },
                { category: 'Biomass', reduction: 18.6 },
                { category: 'Other', reduction: 8.2 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis label={{ value: 'Reduction %', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="reduction" fill="#667eea" name="Avg Reduction %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="insights-section">
        <h3 className="subsection-title">Key Findings</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <span className="insight-icon">🏆</span>
            <h4>Most Effective</h4>
            <p>Industrial regulations show highest average reduction at 22.3%</p>
          </div>

          <div className="insight-card">
            <span className="insight-icon">⚠️</span>
            <h4>Needs Attention</h4>
            <p>Construction controls showing below-target performance</p>
          </div>

          <div className="insight-card">
            <span className="insight-icon">💡</span>
            <h4>Recommendation</h4>
            <p>Scale up industrial and biomass burning policies for maximum impact</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .policy-analytics-container {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .section-title {
          font-size: 24px;
          font-weight: 800;
          margin: 0;
          color: #1a1a1a;
        }

        .time-selector {
          display: flex;
          gap: 8px;
          background: #f7fafc;
          padding: 4px;
          border-radius: 10px;
        }

        .time-btn {
          padding: 8px 16px;
          background: transparent;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          color: #4a5568;
        }

        .time-btn:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        .time-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
        }

        .summary-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          gap: 16px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.3s;
        }

        .summary-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .summary-card.highlight {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .card-icon {
          font-size: 36px;
        }

        .card-content h3 {
          font-size: 32px;
          font-weight: 800;
          margin: 0 0 4px 0;
          font-family: 'Space Mono', monospace;
        }

        .card-content p {
          margin: 0;
          font-size: 14px;
          color: #718096;
          font-weight: 600;
        }

        .summary-card.highlight .card-content p {
          color: rgba(255, 255, 255, 0.9);
        }

        .success-rate {
          display: block;
          font-size: 12px;
          color: #00E400;
          font-weight: 700;
          margin-top: 4px;
        }

        .subsection-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 16px 0;
          color: #1a1a1a;
        }

        .table-container {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .policy-table {
          width: 100%;
          border-collapse: collapse;
        }

        .policy-table th {
          background: #f7fafc;
          padding: 16px;
          text-align: left;
          font-weight: 700;
          font-size: 13px;
          color: #4a5568;
          text-transform: uppercase;
        }

        .policy-table td {
          padding: 16px;
          border-top: 1px solid #e2e8f0;
          font-size: 14px;
          color: #2d3748;
        }

        .policy-table tr:hover {
          background: #f7fafc;
        }

        .policy-name {
          font-weight: 600;
          color: #1a1a1a;
        }

        .category-badge {
          padding: 4px 12px;
          background: #edf2f7;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          color: #4a5568;
          text-transform: capitalize;
        }

        .date-cell {
          color: #718096;
          font-size: 13px;
        }

        .aqi-cell {
          font-weight: 700;
          font-family: 'Space Mono', monospace;
        }

        .reduction-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
        }

        .status-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 8px;
        }

        .chart-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .insight-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .insight-icon {
          font-size: 32px;
          display: block;
          margin-bottom: 12px;
        }

        .insight-card h4 {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #1a1a1a;
        }

        .insight-card p {
          margin: 0;
          font-size: 14px;
          color: #718096;
          line-height: 1.5;
        }

        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          color: #718096;
        }

        @media (max-width: 768px) {
          .summary-grid {
            grid-template-columns: 1fr;
          }

          .table-container {
            overflow-x: auto;
          }

          .policy-table {
            min-width: 800px;
          }

          .insights-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default PolicyAnalytics;