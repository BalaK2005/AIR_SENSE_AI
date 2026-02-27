import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const HealthAlerts = ({ currentAQI, userLocation }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/alerts/me');
      setAlerts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setLoading(false);
    }
  };

  const getHealthAdvice = (aqi) => {
    if (aqi <= 50) {
      return {
        level: 'Good',
        icon: '🌱',
        advice: 'Air quality is excellent. Perfect for outdoor activities!',
        actions: ['Enjoy outdoor activities', 'Open windows for fresh air', 'Perfect for exercise'],
        color: '#00E400',
        bgGradient: 'linear-gradient(135deg, #00E400 0%, #00FF00 100%)'
      };
    } else if (aqi <= 100) {
      return {
        level: 'Satisfactory',
        icon: '😊',
        advice: 'Air quality is acceptable. Normal activities can continue.',
        actions: ['Continue normal outdoor activities', 'Sensitive individuals should monitor symptoms'],
        color: '#FFFF00',
        bgGradient: 'linear-gradient(135deg, #FFFF00 0%, #FFD700 100%)'
      };
    } else if (aqi <= 200) {
      return {
        level: 'Moderate',
        icon: '⚠️',
        advice: 'Sensitive individuals may experience minor breathing discomfort.',
        actions: ['Limit prolonged outdoor exertion', 'Wear mask if sensitive', 'Monitor air quality'],
        color: '#FF7E00',
        bgGradient: 'linear-gradient(135deg, #FF7E00 0%, #FF8C00 100%)'
      };
    } else if (aqi <= 300) {
      return {
        level: 'Poor',
        icon: '😷',
        advice: 'Everyone may experience health effects. Avoid prolonged outdoor activities.',
        actions: ['Avoid outdoor exertion', 'Wear N95 mask outdoors', 'Use air purifiers indoors', 'Close windows'],
        color: '#FF0000',
        bgGradient: 'linear-gradient(135deg, #FF0000 0%, #DC143C 100%)'
      };
    } else if (aqi <= 400) {
      return {
        level: 'Very Poor',
        icon: '🚨',
        advice: 'Health alert: Everyone may experience serious health effects.',
        actions: ['Stay indoors', 'Use air purifiers', 'Wear N95 mask if going out', 'Seek medical advice if symptoms'],
        color: '#8F3F97',
        bgGradient: 'linear-gradient(135deg, #8F3F97 0%, #9932CC 100%)'
      };
    } else {
      return {
        level: 'Severe',
        icon: '🆘',
        advice: 'Emergency conditions. Stay indoors with doors and windows closed.',
        actions: ['Do not go outside', 'Run air purifiers continuously', 'Seek medical help if breathing issues', 'Emergency mode'],
        color: '#7E0023',
        bgGradient: 'linear-gradient(135deg, #7E0023 0%, #8B0000 100%)'
      };
    }
  };

  const healthInfo = currentAQI ? getHealthAdvice(currentAQI) : null;

  const getSeverityIcon = (severity) => {
    const icons = {
      info: '💡',
      warning: '⚠️',
      critical: '🚨',
      emergency: '🆘'
    };
    return icons[severity] || '📢';
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'unread') return alert.status !== 'read';
    return alert.severity === filter;
  });

  const markAsRead = async (alertId) => {
    try {
      await api.put(`/alerts/${alertId}/read`);
      setAlerts(alerts.map(a => 
        a.id === alertId ? { ...a, status: 'read' } : a
      ));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  if (loading) {
    return <div className="health-alerts-loading">Loading health alerts...</div>;
  }

  return (
    <div className="health-alerts-container">
      {/* Current Health Advice Card */}
      {healthInfo && (
        <div 
          className="health-advice-card"
          style={{ background: healthInfo.bgGradient }}
        >
          <div className="advice-header">
            <span className="advice-icon">{healthInfo.icon}</span>
            <div>
              <h2 className="advice-level">{healthInfo.level}</h2>
              <p className="advice-aqi">AQI: {Math.round(currentAQI)}</p>
            </div>
          </div>
          
          <p className="advice-text">{healthInfo.advice}</p>

          <div className="advice-actions">
            <h4>Recommended Actions:</h4>
            <ul>
              {healthInfo.actions.map((action, idx) => (
                <li key={idx}>
                  <span className="check-icon">✓</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="alerts-section">
        <div className="alerts-header">
          <h3>Your Alerts</h3>
          <div className="alert-filters">
            {['all', 'unread', 'critical', 'warning'].map(f => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="alerts-list">
          {filteredAlerts.length === 0 ? (
            <div className="no-alerts">
              <span className="no-alerts-icon">✨</span>
              <p>No alerts at the moment</p>
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <div 
                key={alert.id} 
                className={`alert-item ${alert.status === 'read' ? 'read' : 'unread'}`}
                onClick={() => markAsRead(alert.id)}
              >
                <div className="alert-icon">
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="alert-content">
                  <h4>{alert.title}</h4>
                  <p>{alert.message}</p>
                  <div className="alert-meta">
                    <span className="alert-time">
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                    {alert.location && (
                      <span className="alert-location">📍 {alert.location}</span>
                    )}
                  </div>
                </div>
                {alert.status !== 'read' && (
                  <div className="unread-indicator"></div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .health-alerts-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding: 20px;
        }

        .health-advice-card {
          border-radius: 20px;
          padding: 32px;
          color: white;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          animation: slideIn 0.5s ease-out;
        }

        .advice-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }

        .advice-icon {
          font-size: 48px;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
        }

        .advice-level {
          font-size: 28px;
          font-weight: 800;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .advice-aqi {
          font-size: 16px;
          opacity: 0.95;
          margin: 4px 0 0 0;
        }

        .advice-text {
          font-size: 18px;
          line-height: 1.6;
          margin: 20px 0;
          font-weight: 500;
        }

        .advice-actions h4 {
          font-size: 16px;
          margin: 0 0 12px 0;
          font-weight: 700;
        }

        .advice-actions ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .advice-actions li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 15px;
          padding: 8px 0;
        }

        .check-icon {
          width: 24px;
          height: 24px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .alerts-section {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .alerts-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .alerts-header h3 {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          color: #1a1a1a;
        }

        .alert-filters {
          display: flex;
          gap: 8px;
        }

        .filter-btn {
          padding: 8px 16px;
          border: 2px solid #e2e8f0;
          background: white;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .filter-btn:hover {
          border-color: #cbd5e0;
        }

        .filter-btn.active {
          background: #4A90E2;
          color: white;
          border-color: #4A90E2;
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .alert-item {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: #f7fafc;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .alert-item:hover {
          background: #edf2f7;
          transform: translateX(4px);
        }

        .alert-item.unread {
          background: #ebf8ff;
          border-left: 4px solid #4A90E2;
        }

        .alert-icon {
          font-size: 32px;
          flex-shrink: 0;
        }

        .alert-content {
          flex: 1;
        }

        .alert-content h4 {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #1a1a1a;
        }

        .alert-content p {
          font-size: 14px;
          color: #4a5568;
          margin: 0 0 8px 0;
          line-height: 1.5;
        }

        .alert-meta {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #718096;
        }

        .unread-indicator {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 10px;
          height: 10px;
          background: #4A90E2;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .no-alerts {
          text-align: center;
          padding: 40px;
          color: #a0aec0;
        }

        .no-alerts-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 16px;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @media (max-width: 768px) {
          .health-alerts-container {
            padding: 12px;
          }

          .health-advice-card {
            padding: 20px;
          }

          .advice-level {
            font-size: 22px;
          }

          .alerts-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .alert-filters {
            width: 100%;
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default HealthAlerts;
