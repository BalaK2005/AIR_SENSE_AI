import React, { useState } from 'react';
import PolicyAnalytics from '../components/PolicyAnalytics';
import Recommendations from '../components/Recommendations';

const PolicyImpact = () => {
  const [selectedRegion, setSelectedRegion] = useState('Delhi');
  const [activeTab, setActiveTab] = useState('analytics'); // analytics or recommendations

  const regions = ['Delhi', 'Noida', 'Gurgaon', 'Ghaziabad', 'Faridabad'];

  return (
    <div className="policy-impact-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Policy Impact Assessment</h1>
          <p className="page-subtitle">Track effectiveness and get AI-powered recommendations</p>
        </div>

        <div className="region-selector">
          <select 
            value={selectedRegion} 
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="select-input"
          >
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <span>📊</span>
          Analytics & History
        </button>
        <button 
          className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          <span>💡</span>
          AI Recommendations
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {activeTab === 'analytics' && (
          <PolicyAnalytics region={selectedRegion} />
        )}
        
        {activeTab === 'recommendations' && (
          <Recommendations region={selectedRegion} currentAQI={150} />
        )}
      </div>

      <style jsx>{`
        .policy-impact-page {
          padding: 32px;
          max-width: 1600px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 20px;
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

        .region-selector .select-input {
          padding: 10px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 200px;
        }

        .region-selector .select-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .tabs-container {
          display: flex;
          gap: 8px;
          margin-bottom: 32px;
          background: #f7fafc;
          padding: 4px;
          border-radius: 12px;
          width: fit-content;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: transparent;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          color: #4a5568;
          font-size: 14px;
        }

        .tab-btn:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        .tab-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .tab-content {
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .policy-impact-page {
            padding: 16px;
          }

          .page-header {
            flex-direction: column;
          }

          .tabs-container {
            width: 100%;
          }

          .tab-btn {
            flex: 1;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default PolicyImpact;