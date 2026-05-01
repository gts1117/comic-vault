import React, { useState, useEffect } from 'react';
import { useUIStore } from '../store';
import { BoxData } from './ShelfOverlay';
import { Comic } from '../store';

import './Grid.css';

interface BoxDetailViewProps {
  box: BoxData;
  onClose: () => void;
  onSelectComic: (comicId: number) => void;
}

export const BoxDetailView: React.FC<BoxDetailViewProps> = ({ box, onClose, onSelectComic }) => {
  const { apiPort } = useUIStore();
  const [contents, setContents] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!apiPort) return;
    
    const fetchContents = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:${apiPort}/api/boxes/${box.id}/contents`);
        if (res.ok) {
          const data = await res.json();
          setContents(data);
        }
      } catch (e) {
        console.error("Failed to load box contents", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContents();
  }, [box.id, apiPort]);

  return (
    <div className="archive-overlay">
      <div className="archive-header">
        <div className="archive-title-group">
          <h1 className="archive-title">{box.label}</h1>
          <span className="archive-subtitle">{box.rule_type.toUpperCase()}: {box.rule_value}</span>
        </div>
        <button onClick={onClose} className="archive-close-btn">✕</button>
      </div>
      
      {loading ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <h2 className="archive-subtitle">Scanning Box Contents...</h2>
        </div>
      ) : contents.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <h2 className="archive-subtitle">This box is empty.</h2>
        </div>
      ) : (
        <div className="comic-grid">
          {contents.map(comic => (
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
      )}
    </div>
  );
};
