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
  const { editMode, setEditMode, setIsAddingBox, isSidebarOpen } = useUIStore();

  return (
    <div className={`archivist-sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
      <div className="sidebar-header">
        <h1 className="vault-title">the archive</h1>
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
