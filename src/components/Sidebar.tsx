import React from 'react';
import { useUIStore } from '../store';
import './Sidebar.css';

interface SidebarProps {
  onImportClick: () => void;
  onSettingsClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  onImportClick, 
  onSettingsClick
}) => {
  const { editMode, setEditMode, setIsAddingBox } = useUIStore();

  return (
    <div className="archivist-sidebar">
      <div className="sidebar-header">
        <h1 className="vault-title">THE VAULT</h1>
        <div className="curator-block">
          <div className="curator-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className="curator-info">
            <span className="curator-label">CURATOR</span>
            <span className="curator-name">THE ARCHIVIST</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button className="nav-btn" onClick={onImportClick}>
          <span className="nav-icon">📥</span>
          <span className="nav-text">Import Comics</span>
        </button>
        <button className="nav-btn" onClick={onSettingsClick}>
          <span className="nav-icon">⚙️</span>
          <span className="nav-text">Vault Settings</span>
        </button>
        
        <div className="nav-divider"></div>
        <div className="nav-section-title">ADMINISTRATION</div>
        
        <button className={`nav-btn ${editMode ? 'active' : ''}`} onClick={() => setEditMode(!editMode)}>
          <span className="nav-icon">🛠️</span>
          <span className="nav-text">{editMode ? 'Finish Editing' : 'Edit Shelf Layout'}</span>
        </button>

        {editMode && (
          <button className="nav-btn action-btn" onClick={() => setIsAddingBox(true)}>
            <span className="nav-icon">📦</span>
            <span className="nav-text">Add New Box</span>
          </button>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="system-status">
          <div className="status-dot online"></div>
          <span>SYSTEM ONLINE</span>
        </div>
      </div>
    </div>
  );
};
