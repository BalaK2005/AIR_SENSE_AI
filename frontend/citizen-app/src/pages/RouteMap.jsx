import React from 'react';
import SafeRoute from '../components/SafeRoute';

const RouteMap = () => {
  return (
    <div className="route-map-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">🗺️</span>
            Safe Route Planner
          </h1>
          <p className="page-subtitle">
            Find the healthiest routes based on real-time air quality data
          </p>
        </div>

        <div className="info-cards">
          <div className="info-card">
            <span className="info-icon">💚</span>
            <div>
              <h3>AQI-Optimized</h3>
              <p>Routes minimize exposure to pollution</p>
            </div>
          </div>

          <div className="info-card">
            <span className="info-icon">⚡</span>
            <div>
              <h3>Real-Time</h3>
              <p>Live air quality monitoring</p>
            </div>
          </div>

          <div className="info-card">
            <span className="info-icon">🎯</span>
            <div>
              <h3>Multi-Modal</h3>
              <p>Walking, driving, cycling & transit</p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">
        <SafeRoute />
      </div>

      <div className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Enter Your Route</h3>
            <p>Provide start and end locations or use your current location</p>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Select Travel Mode</h3>
            <p>Choose between driving, walking, cycling, or public transit</p>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Get Smart Routes</h3>
            <p>Receive AQI-optimized route recommendations with health impact scores</p>
          </div>

          <div className="step-card">
            <div className="step-number">4</div>
            <h3>Make Informed Choice</h3>
            <p>Compare routes and choose the safest option for your health</p>
          </div>
        </div>
      </div>

      <div className="tips-section">
        <div className="tips-card">
          <h3>💡 Pro Tips</h3>
          <ul>
            <li>Plan your route during off-peak hours when AQI is typically lower</li>
            <li>Walking and cycling routes prioritize paths away from major roads</li>
            <li>Check the forecast before planning longer trips</li>
            <li>Save frequently used routes for quick access</li>
            <li>Consider air quality when planning outdoor activities</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .route-map-page {
          min-height: 100vh;
          background: #f7fafc;
        }

        .page-header {
          background: white;
          padding: 48px 40px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto 32px;
          text-align: center;
        }

        .page-title {
          font-size: 48px;
          font-weight: 900;
          margin: 0 0 16px 0;
          color: #1a1a1a;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }

        .title-icon {
          font-size: 56px;
        }

        .page-subtitle {
          font-size: 18px;
          color: #718096;
          margin: 0;
          max-width: 600px;
          margin: 0 auto;
        }

        .info-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .info-card {
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s;
        }

        .info-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }

        .info-icon {
          font-size: 40px;
        }

        .info-card h3 {
          font-size: 18px;
          font-weight: 800;
          margin: 0 0 4px 0;
          color: #1a1a1a;
        }

        .info-card p {
          font-size: 14px;
          color: #718096;
          margin: 0;
        }

        .page-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .how-it-works {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 20px;
        }

        .section-title {
          text-align: center;
          font-size: 40px;
          font-weight: 800;
          margin: 0 0 48px 0;
          color: #1a1a1a;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 24px;
        }

        .step-card {
          background: white;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          text-align: center;
          transition: all 0.3s;
        }

        .step-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
        }

        .step-number {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 900;
          margin: 0 auto 20px;
        }

        .step-card h3 {
          font-size: 20px;
          font-weight: 800;
          margin: 0 0 12px 0;
          color: #1a1a1a;
        }

        .step-card p {
          font-size: 14px;
          color: #718096;
          line-height: 1.6;
          margin: 0;
        }

        .tips-section {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px 80px;
        }

        .tips-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
        }

        .tips-card h3 {
          font-size: 28px;
          font-weight: 800;
          margin: 0 0 24px 0;
        }

        .tips-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .tips-card li {
          padding: 12px 0;
          padding-left: 32px;
          position: relative;
          font-size: 16px;
          line-height: 1.6;
        }

        .tips-card li::before {
          content: '✓';
          position: absolute;
          left: 0;
          width: 24px;
          height: 24px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        @media (max-width: 768px) {
          .page-header {
            padding: 32px 20px;
          }

          .page-title {
            font-size: 32px;
            flex-direction: column;
            gap: 8px;
          }

          .title-icon {
            font-size: 40px;
          }

          .info-cards {
            grid-template-columns: 1fr;
          }

          .section-title {
            font-size: 28px;
          }

          .steps-grid {
            grid-template-columns: 1fr;
          }

          .tips-card {
            padding: 24px;
          }

          .tips-card h3 {
            font-size: 22px;
          }

          .tips-card li {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default RouteMap;