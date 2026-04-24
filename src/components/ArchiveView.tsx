import React, { useState, useEffect } from 'react';
import { useLibraryStore } from '../store';
import { invoke } from '@tauri-apps/api/core';

interface ArchiveViewProps {
  onClose: () => void;
  onSelectComic: (comicId: int) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ onClose, onSelectComic }) => {
  const { comics, apiPort } = useLibraryStore();
  const [filter, setFilter] = useState('');
  
  const filteredComics = comics.filter(c => 
    c.title?.toLowerCase().includes(filter.toLowerCase()) || 
    c.series_name?.toLowerCase().includes(filter.toLowerCase()) ||
    c.publisher?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="archive-view-overlay" style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      zIndex: 2000,
      display: 'flex', flexDirection: 'column',
      padding: '40px',
      color: 'white',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>Master Archive</h1>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: 'white', fontSize: '32px', cursor: 'pointer'
        }}>✕</button>
      </div>
      
      <input 
        type="text" 
        placeholder="Search publisher, series, or title..." 
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{
          width: '100%', padding: '15px', fontSize: '18px',
          backgroundColor: '#222', border: '1px solid #444', color: 'white',
          borderRadius: '8px', marginBottom: '30px'
        }}
      />
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '30px',
        overflowY: 'auto',
        paddingRight: '10px'
      }}>
        {filteredComics.map(comic => (
          <div 
            key={comic.id} 
            onClick={() => onSelectComic(comic.id)}
            style={{
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{
              width: '100%',
              aspectRatio: '0.66',
              backgroundColor: '#111',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '10px',
              border: '1px solid #333'
            }}>
              {apiPort && (
                <img 
                  src={`http://localhost:${apiPort}/api/thumb/${comic.id}`} 
                  alt={comic.title || `Issue ${comic.issue_number}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#aaa', textTransform: 'uppercase' }}>{comic.publisher}</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{comic.series_name} #{comic.issue_number}</div>
            <div style={{ fontSize: '14px', color: '#ccc' }}>{comic.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
