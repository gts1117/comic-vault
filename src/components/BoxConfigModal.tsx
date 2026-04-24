import React, { useState } from 'react';
import { useLibraryStore } from '../store';
import { invoke } from '@tauri-apps/api/core';

interface BoxConfigModalProps {
  onClose: () => void;
  onSave: (config: { label: string, rule_type: string, rule_value: string }) => void;
}

export const BoxConfigModal: React.FC<BoxConfigModalProps> = ({ onClose, onSave }) => {
  const { comics } = useLibraryStore();
  const [label, setLabel] = useState('');
  const [ruleType, setRuleType] = useState('publisher');
  const [ruleValue, setRuleValue] = useState('');

  // Extract unique options from loaded comics
  const publishers = Array.from(new Set(comics.map(c => c.publisher).filter(Boolean))).sort();
  const seriesList = Array.from(new Set(comics.map(c => c.series_name).filter(Boolean))).sort();

  const handleSave = () => {
    if (!label || !ruleValue) {
      alert("Please fill out all fields.");
      return;
    }
    onSave({ label, rule_type: ruleType, rule_value: ruleValue });
  };

  return (
    <div className="modal-overlay" style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 3000
    }}>
      <div className="modal-content" style={{
        backgroundColor: '#1a1a1a', padding: '40px', borderRadius: '12px',
        width: '500px', color: 'white', border: '1px solid #333'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '30px' }}>📦 Configure New Box</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Box Label (Text on the box)</label>
          <input 
            type="text" 
            value={label} 
            onChange={(e) => setLabel(e.target.value.toUpperCase())}
            placeholder="e.g. MARVEL"
            style={{
              width: '100%', padding: '12px', backgroundColor: '#333',
              border: 'none', borderRadius: '4px', color: 'white', fontSize: '16px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>What goes in this box?</label>
          <select 
            value={ruleType} 
            onChange={(e) => {
              setRuleType(e.target.value);
              setRuleValue(''); // Reset value when changing type
            }}
            style={{
              width: '100%', padding: '12px', backgroundColor: '#333',
              border: 'none', borderRadius: '4px', color: 'white', fontSize: '16px'
            }}
          >
            <option value="publisher">Everything by a specific Publisher</option>
            <option value="series">All issues in a specific Series</option>
          </select>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Select Target</label>
          <select 
            value={ruleValue} 
            onChange={(e) => setRuleValue(e.target.value)}
            style={{
              width: '100%', padding: '12px', backgroundColor: '#333',
              border: 'none', borderRadius: '4px', color: 'white', fontSize: '16px'
            }}
          >
            <option value="" disabled>-- Select --</option>
            {ruleType === 'publisher' && publishers.map(p => <option key={p} value={p}>{p}</option>)}
            {ruleType === 'series' && seriesList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
          <button className="hud-btn" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Create Box</button>
        </div>
      </div>
    </div>
  );
};
