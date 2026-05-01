import React, { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '../store';

import './Reader.css';

interface ReaderProps {
  comicId: number;
  onClose: () => void;
}

export const Reader: React.FC<ReaderProps> = ({ comicId, onClose }) => {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const apiPort = useUIStore(state => state.apiPort);

  // Initial load
  useEffect(() => {
    if (!apiPort) return;
    
    const fetchMetadata = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:${apiPort}/api/comic/${comicId}/read`);
        if (!res.ok) {
          if (res.status === 422) {
            setError("This comic needs to be converted to CBZ before reading.");
            return;
          }
          throw new Error("Failed to fetch comic data");
        }
        const data = await res.json();
        setTotalPages(data.total_pages);
        setCurrentPage(data.current_page || 0);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [comicId, apiPort]);

  // Sync progress to backend when component unmounts or page changes significantly
  useEffect(() => {
    if (totalPages === 0 || !apiPort) return; // Don't sync if not loaded

    const syncProgress = async () => {
      try {
        await fetch(`http://127.0.0.1:${apiPort}/api/comic/${comicId}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            current_page: currentPage,
            is_completed: currentPage >= totalPages - 1
          })
        });
      } catch (err) {
        console.error("Failed to sync reading progress", err);
      }
    };

    syncProgress();

    return () => {
      syncProgress();
    };
  }, [currentPage, totalPages, comicId]);

  const goToNext = useCallback(() => {
    if (currentPage < totalPages - 1) setCurrentPage(p => p + 1);
  }, [currentPage, totalPages]);

  const goToPrev = useCallback(() => {
    if (currentPage > 0) setCurrentPage(p => p - 1);
  }, [currentPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onClose]);

  if (error) {
    return (
      <div className="reader-overlay">
        <div className="modal-panel" style={{ zIndex: 5000 }}>
          <h2 className="modal-title" style={{ color: '#E50914' }}>Error</h2>
          <p className="modal-help-text" style={{ fontSize: '16px', marginBottom: '20px' }}>{error}</p>
          <div className="modal-actions">
            <button className="btn-primary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || totalPages === 0) {
    return (
      <div className="reader-overlay">
        <div className="reader-book-container">
          <span className="reader-progress-stamp">OPENING ARCHIVE...</span>
        </div>
      </div>
    );
  }

  const currentImageUrl = apiPort ? `http://127.0.0.1:${apiPort}/api/comic/${comicId}/page/${currentPage}` : '';
  const nextImageUrl1 = apiPort && currentPage + 1 < totalPages ? `http://127.0.0.1:${apiPort}/api/comic/${comicId}/page/${currentPage + 1}` : null;
  const nextImageUrl2 = apiPort && currentPage + 2 < totalPages ? `http://127.0.0.1:${apiPort}/api/comic/${comicId}/page/${currentPage + 2}` : null;

  return (
    <div className="reader-overlay">
      <div className="reader-book-container">
        
        {/* Ribbon Bookmark Controls */}
        <div className="reader-ribbon">
          <button className="ribbon-btn" onClick={onClose} title="Close Reader">✕</button>
          <button className="ribbon-btn" onClick={() => {}} title="Single Page View">📄</button>
          <button className="ribbon-btn" onClick={() => {}} title="Settings">⚙️</button>
        </div>

        {/* The Page Content Area */}
        <div className="reader-page-wrapper">
          <div className="reader-click-zone left" onClick={goToPrev} />
          <div className="reader-click-zone right" onClick={goToNext} />
          
          <img 
            src={currentImageUrl} 
            alt={`Page ${currentPage + 1}`} 
            className="reader-image"
          />
        </div>

        {/* Gold Stamped Progress */}
        <div className="reader-progress-stamp">
          PAGE {currentPage + 1} OF {totalPages}
        </div>

      </div>

      {/* Pre-fetching engine: Hidden images to force browser cache */}
      <div style={{ display: 'none' }}>
        {nextImageUrl1 && <img src={nextImageUrl1} alt="prefetch 1" />}
        {nextImageUrl2 && <img src={nextImageUrl2} alt="prefetch 2" />}
      </div>
    </div>
  );
};
