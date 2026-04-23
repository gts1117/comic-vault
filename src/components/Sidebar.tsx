import React from 'react';
import { useUIStore, useLibraryStore } from '../store';

interface SidebarProps {
  onOpenSettings: () => void;
  onOpenImport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings, onOpenImport }) => {
  const { comics } = useLibraryStore();
  const { activePublisher, setActivePublisher, apiPort } = useUIStore();

  // Extract unique publishers from comics
  const publishers = Array.from(new Set(
    (Array.isArray(comics) ? comics : []).map(c => c.publisher)
  )).sort();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Comic Vault</h2>
        <button onClick={onOpenImport} className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>
          Import Comics
        </button>
      </div>

      <nav className="sidebar-nav">
        <div 
          className={`nav-item ${activePublisher === null ? 'active' : ''}`}
          onClick={() => setActivePublisher(null)}
        >
          All Comics
        </div>
        
        <div className="nav-section-title">Publishers</div>
        {publishers.map(pub => (
          <div 
            key={pub} 
            className={`nav-item ${activePublisher === pub ? 'active' : ''}`}
            onClick={() => setActivePublisher(pub)}
          >
            {pub}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="status-row">
          <span className={`status-dot ${apiPort ? 'connected' : ''}`}></span>
          {apiPort ? `Connected (: ${apiPort})` : 'Disconnected'}
        </div>
        <button onClick={onOpenSettings} className="btn-secondary" style={{ width: '100%', marginTop: '10px' }}>
          Settings
        </button>
      </div>
    </aside>
  );
};
