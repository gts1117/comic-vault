import React, { useState } from 'react';
import { useLibraryStore } from '../store';
import { invoke } from '@tauri-apps/api/core';

import './Modals.css';

interface BoxConfigModalProps {
  onClose: () => void;
  onSave: (config: { label: string, rule_type: string, rule_value: string }) => void;
}

export const BoxConfigModal: React.FC<BoxConfigModalProps> = ({ onClose, onSave }) => {
  const { comics } = useLibraryStore();
  const [label, setLabel] = useState('');
  const [ruleType, setRuleType] = useState('publisher');
  const [ruleValue, setRuleValue] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  // Extract unique options from loaded comics
  const publishers = Array.from(new Set(comics.map(c => c.publisher).filter(Boolean))).sort();
  const seriesList = Array.from(new Set(comics.map(c => c.series_name).filter(Boolean))).sort();

  const handleSave = () => {
    if (!label || !ruleValue) {
      setErrorMsg("Please fill out all fields.");
      return;
    }
    setErrorMsg('');
    onSave({ label, rule_type: ruleType, rule_value: ruleValue });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <h2 className="modal-title">📦 Configure New Box</h2>
        
        <div className="modal-group">
          <label className="modal-label">Box Label (Text on the box)</label>
          <input 
            type="text" 
            value={label} 
            onChange={(e) => setLabel(e.target.value.toUpperCase())}
            placeholder="e.g. MARVEL"
            className="modal-input"
          />
        </div>

        <div className="modal-group">
          <label className="modal-label">What goes in this box?</label>
          <select 
            value={ruleType} 
            onChange={(e) => {
              setRuleType(e.target.value);
              setRuleValue(''); // Reset value when changing type
            }}
            className="modal-select"
          >
            <option value="publisher">Everything by a specific Publisher</option>
            <option value="series">All issues in a specific Series</option>
          </select>
        </div>

        <div className="modal-group">
          <label className="modal-label">Select Target</label>
          <select 
            value={ruleValue} 
            onChange={(e) => setRuleValue(e.target.value)}
            className="modal-select"
          >
            <option value="" disabled>-- Select --</option>
            {ruleType === 'publisher' && publishers.map(p => <option key={p} value={p}>{p}</option>)}
            {ruleType === 'series' && seriesList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {publishers.length === 0 && seriesList.length === 0 && (
            <div className="modal-help-text" style={{ color: '#D4AF37' }}>
              No comics found in your library yet! Please import some comics first so you can select a publisher or series.
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="modal-error">
            {errorMsg}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Create Box</button>
        </div>
      </div>
    </div>
  );
};
