import React, { useState } from 'react';
import SourceAttribution from '../components/SourceAttribution';

const SourceAnalysis = () => {
  const [selectedRegion, setSelectedRegion] = useState('Delhi');
  const [timeRange, setTimeRange] = useState('current');

  const regions = ['Delhi', 'Noida', 'Gurgaon', 'Ghaziabad', 'Faridabad'];

  return (
    <div className="source-analysis-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Pollution Source Analysis</h1>
          <p className="page-subtitle">Identify and quantify pollution sources for targeted interventions</p>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-section">
        <div className="control-group">
          <label>Region</label>
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

        <div className="control-group">
          <label>Time Range</label>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="select-input"
          >
            <option value="current">Current</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <SourceAttribution region={selectedRegion} />

      <style jsx>{`
        .source-analysis-page {
          padding: 32px;
          max-width: 1600px;
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

        .controls-section {
          display: flex;
          gap: 20px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .control-group label {
          font-size: 13px;
          font-weight: 600;
          color: #4a5568;
        }

        .select-input {
          padding: 10px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 200px;
        }

        .select-input:focus {
          outline: none;
          border-color: #667eea;
        }

        @media (max-width: 768px) {
          .source-analysis-page {
            padding: 16px;
          }

          .controls-section {
            flex-direction: column;
          }

          .select-input {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default SourceAnalysis;