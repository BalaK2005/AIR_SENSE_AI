import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ user, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/', icon: '📊', label: 'Overview' },
    { path: '/source-analysis', icon: '🔬', label: 'Source Analysis' },
    { path: '/policy-impact', icon: '📈', label: 'Policy Impact' },
    { path: '/simulation', icon: '🎯', label: 'Simulation' },
    { path: '/recommendations', icon: '💡', label: 'AI Recommendations' },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        {!collapsed && (
          <div className="brand">
            <span className="brand-icon">🌬️</span>
            <span className="brand-text">AirVision Policy</span>
          </div>
        )}
        <button 
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            title={collapsed ? item.label : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Quick Stats */}
      {!collapsed && (
        <div className="quick-stats">
          <h4 className="stats-title">Quick Stats</h4>
          <div className="stat-item">
            <span className="stat-icon">📍</span>
            <div className="stat-content">
              <span className="stat-value">150+</span>
              <span className="stat-label">Stations</span>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-icon">📋</span>
            <div className="stat-content">
              <span className="stat-value">42</span>
              <span className="stat-label">Active Policies</span>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🎯</span>
            <div className="stat-content">
              <span className="stat-value">18%</span>
              <span className="stat-label">Avg Reduction</span>
            </div>
          </div>
        </div>
      )}

      {/* User Section */}
      <div className="sidebar-footer">
        {user && (
          <div className="user-section">
            {!collapsed && (
              <>
                <div className="user-avatar">
                  {user.full_name?.[0] || 'P'}
                </div>
                <div className="user-info">
                  <div className="user-name">{user.full_name || user.username}</div>
                  <div className="user-role">Policy Maker</div>
                </div>
              </>
            )}
            <button 
              className="logout-btn"
              onClick={onLogout}
              title="Logout"
            >
              {collapsed ? '🚪' : 'Logout'}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .sidebar {
          width: 280px;
          height: 100vh;
          background: linear-gradient(180deg, #1a202c 0%, #2d3748 100%);
          color: white;
          display: flex;
          flex-direction: column;
          transition: width 0.3s ease;
          position: sticky;
          top: 0;
          overflow-y: auto;
        }

        .sidebar.collapsed {
          width: 80px;
        }

        .sidebar-header {
          padding: 24px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-icon {
          font-size: 28px;
        }

        .brand-text {
          font-size: 18px;
          font-weight: 800;
        }

        .collapse-btn {
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .collapse-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .sidebar-nav {
          flex: 1;
          padding: 20px 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 20px;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transition: all 0.2s;
          position: relative;
        }

        .nav-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 0;
          background: white;
          border-radius: 0 4px 4px 0;
          transition: height 0.2s;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        .nav-item.active {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .nav-item.active::before {
          height: 32px;
        }

        .collapsed .nav-item {
          justify-content: center;
        }

        .nav-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .nav-label {
          font-weight: 600;
          font-size: 14px;
        }

        .quick-stats {
          padding: 20px;
          background: rgba(0, 0, 0, 0.2);
          margin: 0 20px 20px;
          border-radius: 12px;
        }

        .stats-title {
          font-size: 13px;
          font-weight: 700;
          margin: 0 0 16px 0;
          opacity: 0.7;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-item:first-of-type {
          border-top: none;
          padding-top: 0;
        }

        .stat-icon {
          font-size: 24px;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 800;
          font-family: 'Space Mono', monospace;
        }

        .stat-label {
          font-size: 11px;
          opacity: 0.7;
        }

        .sidebar-footer {
          padding: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .user-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 18px;
          flex-shrink: 0;
        }

        .user-info {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          font-weight: 700;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          font-size: 12px;
          opacity: 0.7;
        }

        .logout-btn {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 13px;
        }

        .logout-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .collapsed .user-section {
          flex-direction: column;
        }

        .collapsed .logout-btn {
          padding: 8px;
          font-size: 20px;
        }

        /* Scrollbar */}
        .sidebar::-webkit-scrollbar {
          width: 6px;
        }

        .sidebar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }

        .sidebar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .sidebar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            z-index: 1000;
            transform: translateX(-100%);
          }

          .sidebar.active {
            transform: translateX(0);
          }
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;