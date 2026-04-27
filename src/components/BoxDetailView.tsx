import React, { useState, useEffect } from 'react';
import { useUIStore } from '../store';
import { BoxData } from './ShelfOverlay';
import { Comic } from '../store';

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
    <div className="box-detail-overlay" style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      zIndex: 2000,
      display: 'flex', flexDirection: 'column',
      padding: '40px',
      color: 'white',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '42px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '3px' }}>
            {box.label}
          </h1>
          <div style={{ fontSize: '14px', color: '#aaa', marginTop: '5px' }}>
            {box.rule_type.toUpperCase()}: {box.rule_value}
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: 'white', fontSize: '32px', cursor: 'pointer'
        }}>✕</button>
      </div>
      
      {loading ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <h2>Loading contents...</h2>
        </div>
      ) : contents.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <h2 style={{ color: '#666' }}>This box is empty.</h2>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '30px',
          overflowY: 'auto',
          paddingRight: '10px'
        }}>
          {contents.map(comic => (
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
              <div style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase' }}>{comic.publisher}</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{comic.series_name} #{comic.issue_number}</div>
              <div style={{ fontSize: '12px', color: '#ccc' }}>{comic.title}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
