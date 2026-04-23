import React from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useUIStore, useLibraryStore } from '../store';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { apiPort, libraryPath, setLibraryPath } = useUIStore();
  const { setComics, setLoading } = useLibraryStore();

  const handlePickFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Master Library Folder'
      });

      if (selected && typeof selected === 'string') {
        setLoading(true);
        // Update on backend
        const resp = await fetch(`http://127.0.0.1:${apiPort}/api/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            settings: { library_path: selected }
          })
        });

        if (resp.ok) {
          setLibraryPath(selected);
          
          // Refresh library after setting path (backend now triggers automatic scan)
          const lResp = await fetch(`http://127.0.0.1:${apiPort}/api/library`);
          if (lResp.ok) {
            const data = await lResp.json();
            setComics(data);
          }
        }
      }
    } catch (e) {
      console.error("Failed to pick folder", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Settings</h2>
        
        <div className="settings-group">
          <label>Master Library Location</label>
          <div className="path-row">
            <input 
              type="text" 
              value={libraryPath || "Not Set"} 
              readOnly 
              className="path-input"
            />
            <button onClick={handlePickFolder} className="btn-secondary">Change</button>
          </div>
          <p className="help-text">This is where your comics will be organized and stored permanently.</p>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-primary">Done</button>
        </div>
      </div>
    </div>
  );
};
