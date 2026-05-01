import React, { useState, useEffect } from 'react';
import { useLibraryStore, useUIStore } from '../store';
import { invoke } from '@tauri-apps/api/core';

import './Grid.css';

interface ArchiveViewProps {
  onClose: () => void;
  onSelectComic: (comicId: number) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ onClose, onSelectComic }) => {
  const { comics } = useLibraryStore();
  const { apiPort } = useUIStore();
  const [filter, setFilter] = useState('');
  
  const filteredComics = comics.filter(c => 
    c.title?.toLowerCase().includes(filter.toLowerCase()) || 
    c.series_name?.toLowerCase().includes(filter.toLowerCase()) ||
    c.publisher?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="archive-overlay">
      <div className="archive-header">
        <div className="archive-title-group">
          <h1 className="archive-title">MASTER ARCHIVE</h1>
          <span className="archive-subtitle">Global Collection Catalog</span>
        </div>
        <button onClick={onClose} className="archive-close-btn">✕</button>
      </div>
      
      <input 
        type="text" 
        className="archive-search"
        placeholder="SEARCH PUBLISHER, SERIES, OR TITLE..." 
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      
      <div className="comic-grid">
        {filteredComics.map(comic => (
          <div 
            key={comic.id} 
            className="comic-card"
            onClick={() => onSelectComic(comic.id)}
          >
            <div className="comic-card-cover">
              {apiPort && (
                <img 
                  src={`http://localhost:${apiPort}/api/thumb/${comic.id}`} 
                  alt={comic.title || `Issue ${comic.issue_number}`}
                  className="comic-card-image"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </div>
            <div className="comic-card-publisher">{comic.publisher || "UNKNOWN PUBLISHER"}</div>
            <div className="comic-card-series">{comic.series_name} #{comic.issue_number}</div>
            <div className="comic-card-title">{comic.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
