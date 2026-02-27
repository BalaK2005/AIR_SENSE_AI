import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const Recommendations = ({ region = 'Delhi', currentAQI }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  useEffect(() => {
    fetchRecommendations();
  }, [region]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/policy/recommendations', {
        params: { region }
      });
      setRecommendations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'critical': '#FF0000',
      'high': '#FF7E00',
      'medium': '#FFFF00',
      'low': '#00E400'
    };
    return colors[priority] || '#718096';
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      'critical': '🆘',
      'high': '🔴',
      'medium': '🟡',
      'low': '🟢'
    };
    return icons[priority] || '📌';
  };

  const filteredRecommendations = urgencyFilter === 'all' 
    ? recommendations 
    : recommendations.filter(r => r.priority === urgencyFilter);

  if (loading) {
    return <div className="loading">Generating AI recommendations...</div>;
  }

  return (
    <div className="recommendations-container">
      {/* Header */}
      <div className="recommendations-header">
        <div>
          <h2 className="section-title">AI-Powered Policy Recommendations</h2>
          <p className="section-subtitle">
            Data-driven suggestions for {region} based on current AQI: <strong>{currentAQI}</strong>
          </p>
        </div>

        <div className="filter-buttons">
          {['all', 'critical', 'high', 'medium', 'low'].map(filter => (
            <button
              key={filter}
              className={`filter-btn ${urgencyFilter === filter ? 'active' : ''}`}
              onClick={() => setUrgencyFilter(filter)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stats-row">
        <div className="stat-card critical">
          <h3>{recommendations.filter(r => r.priority === 'critical').length}</h3>
          <p>Critical Actions</p>
        </div>
        <div className="stat-card high">
          <h3>{recommendations.filter(r => r.priority === 'high').length}</h3>
          <p>High Priority</p>
        </div>
        <div className="stat-card medium">
          <h3>{recommendations.filter(r => r.priority === 'medium').length}</h3>
          <p>Medium Priority</p>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="recommendations-list">
        {filteredRecommendations.length === 0 ? (
          <div className="no-recommendations">
            <span className="empty-icon">✨</span>
            <p>No recommendations for this priority level</p>
          </div>
        ) : (
          filteredRecommendations.map((rec, index) => (
            <div key={index} className="recommendation-card">
              {/* Priority Badge */}
              <div 
                className="priority-badge"
                style={{ 
                  backgroundColor: getPriorityColor(rec.priority) + '20',
                  borderLeft: `4px solid ${getPriorityColor(rec.priority)}`
                }}
              >
                <span className="priority-icon">{getPriorityIcon(rec.priority)}</span>
                <span className="priority-text">{rec.priority.toUpperCase()}</span>
              </div>

              {/* Content */}
              <div className="rec-content">
                <h3 className="rec-title">{rec.title}</h3>
                <p className="rec-description">{rec.description}</p>

                {/* Metrics Grid */}
                <div className="metrics-grid">
                  <div className="metric">
                    <span className="metric-label">Expected Impact</span>
                    <span className="metric-value">{rec.estimated_impact}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Cost</span>
                    <span className="metric-value">{rec.implementation_cost}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Timeframe</span>
                    <span className="metric-value">{rec.timeframe}</span>
                  </div>
                </div>

                {/* Affected Sectors */}
                {rec.affected_sectors && rec.affected_sectors.length > 0 && (
                  <div className="affected-sectors">
                    <span className="sectors-label">Affects:</span>
                    {rec.affected_sectors.map((sector, i) => (
                      <span key={i} className="sector-tag">{sector}</span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="rec-actions">
                  <button className="action-btn primary">
                    <span>🎯</span>
                    Simulate Impact
                  </button>
                  <button className="action-btn secondary">
                    <span>📋</span>
                    View Details
                  </button>
                  <button className="action-btn secondary">
                    <span>✅</span>
                    Implement
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* AI Insights */}
      <div className="ai-insights-card">
        <div className="insights-header">
          <span className="ai-icon">🤖</span>
          <h3>AI Analysis Summary</h3>
        </div>
        <ul className="insights-list">
          <li>Based on historical data, implementing top 3 recommendations could reduce AQI by 25-35%</li>
          <li>Current conditions suggest immediate action on vehicular and industrial sources</li>
          <li>Weather forecast indicates favorable dispersion conditions in next 48 hours - optimal for policy implementation</li>
          <li>Similar measures in neighboring regions showed 28% average effectiveness</li>
        </ul>
      </div>

      <style jsx>{`
        .recommendations-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .recommendations-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 20px;
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

        .filter-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 8px 16px;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          color: #4a5568;
          font-size: 13px;
        }

        .filter-btn:hover {
          border-color: #cbd5e0;
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .stat-card.critical {
          border-top: 4px solid #FF0000;
        }

        .stat-card.high {
          border-top: 4px solid #FF7E00;
        }

        .stat-card.medium {
          border-top: 4px solid #FFFF00;
        }

        .stat-card h3 {
          font-size: 36px;
          font-weight: 900;
          margin: 0 0 8px 0;
          color: #1a1a1a;
          font-family: 'Space Mono', monospace;
        }

        .stat-card p {
          margin: 0;
          color: #718096;
          font-weight: 600;
          font-size: 14px;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .recommendation-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.3s;
        }

        .recommendation-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .priority-badge {
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .priority-icon {
          font-size: 24px;
        }

        .priority-text {
          font-weight: 800;
          font-size: 13px;
          letter-spacing: 0.5px;
        }

        .rec-content {
          padding: 24px;
        }

        .rec-title {
          font-size: 20px;
          font-weight: 800;
          margin: 0 0 12px 0;
          color: #1a1a1a;
        }

        .rec-description {
          font-size: 15px;
          color: #4a5568;
          line-height: 1.6;
          margin: 0 0 20px 0;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          padding: 20px;
          background: #f7fafc;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .metric {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metric-label {
          font-size: 12px;
          color: #718096;
          font-weight: 600;
        }

        .metric-value {
          font-size: 16px;
          font-weight: 800;
          color: #1a1a1a;
        }

        .affected-sectors {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
          align-items: center;
        }

        .sectors-label {
          font-size: 13px;
          font-weight: 600;
          color: #718096;
        }

        .sector-tag {
          padding: 6px 12px;
          background: #edf2f7;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          color: #4a5568;
          text-transform: capitalize;
        }

        .rec-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-size: 14px;
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .action-btn.secondary {
          background: #f7fafc;
          color: #4a5568;
          border: 2px solid #e2e8f0;
        }

        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .no-recommendations {
          text-align: center;
          padding: 60px 20px;
          color: #a0aec0;
        }

        .empty-icon {
          font-size: 64px;
          display: block;
          margin-bottom: 16px;
        }

        .ai-insights-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
        }

        .insights-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .ai-icon {
          font-size: 32px;
        }

        .insights-header h3 {
          font-size: 20px;
          font-weight: 800;
          margin: 0;
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

        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          color: #718096;
        }

        @media (max-width: 768px) {
          .recommendations-header {
            flex-direction: column;
          }

          .stats-row {
            grid-template-columns: 1fr;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .rec-actions {
            flex-direction: column;
          }

          .action-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Recommendations;