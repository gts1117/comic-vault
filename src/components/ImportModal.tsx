import React, { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useUIStore, useLibraryStore } from '../store';

import './Modals.css';

interface ImportModalProps {
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ onClose }) => {
  const { apiPort, isImporting, setIsImporting } = useUIStore();
  const { setComics, setError } = useLibraryStore();
  const [sourcePath, setSourcePath] = useState<string | null>(null);
  const [mode, setMode] = useState<'copy' | 'move'>('copy');
  const [status, setStatus] = useState<string | null>(null);

  const handlePickSource = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Folder to Import'
      });
      if (selected && typeof selected === 'string') {
        setSourcePath(selected);
      }
    } catch (e) {
      console.error("Failed to pick source folder", e);
    }
  };

  const handleStartImport = async () => {
    if (!sourcePath || !apiPort) return;
    
    setIsImporting(true);
    setStatus("Organizing and importing comics...");
    
    try {
      const resp = await fetch(`http://localhost:${apiPort}/api/import/organized`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_dir: sourcePath,
          mode: mode
        })
      });
      
      const result = await resp.json();
      if (result.success) {
        setStatus("Import complete!");
        // Refresh library
        const lResp = await fetch(`http://localhost:${apiPort}/api/library`);
        if (lResp.ok) setComics(await lResp.json());
      } else {
        throw new Error(result.errors?.[0] || "Import failed");
      }
    } catch (e) {
      console.error(e);
      setError("Failed to import comics.");
      setStatus("Error during import.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">📥 Import Comics</h2>
        
        <div className="modal-group">
          <label className="modal-label">Source Folder</label>
          <div className="path-row">
            <input 
              type="text" 
              value={sourcePath || "Not Selected"} 
              readOnly 
              className="modal-input"
            />
            <button onClick={handlePickSource} className="btn-secondary" disabled={isImporting}>Select</button>
          </div>
        </div>

        <div className="modal-group">
          <label className="modal-label">Import Mode</label>
          <div className="radio-group" style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
            <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="radio" 
                checked={mode === 'copy'} 
                onChange={() => setMode('copy')} 
                disabled={isImporting}
                style={{ accentColor: '#D4AF37' }}
              />
              Copy (Safe)
            </label>
            <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="radio" 
                checked={mode === 'move'} 
                onChange={() => setMode('move')} 
                disabled={isImporting}
                style={{ accentColor: '#D4AF37' }}
              />
              Move (Organize Original)
            </label>
          </div>
          <p className="modal-help-text">
            Comics will be indexed and moved to your Master Library folder.
          </p>
        </div>

        {status && <div className={`modal-help-text ${isImporting ? 'pulse' : ''}`} style={{ color: '#D4AF37' }}>{status}</div>}

        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary" disabled={isImporting}>Cancel</button>
          <button 
            onClick={handleStartImport} 
            className="btn-primary" 
            disabled={isImporting || !sourcePath}
          >
            {isImporting ? "Importing..." : "Start Import"}
          </button>
        </div>
      </div>
    </div>
  );
};
