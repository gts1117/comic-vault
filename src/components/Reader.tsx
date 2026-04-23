import React, { useState, useEffect, useCallback } from 'react';

interface ReaderProps {
  comicId: number;
  onClose: () => void;
}

export const Reader: React.FC<ReaderProps> = ({ comicId, onClose }) => {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/comic/${comicId}/read`);
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
  }, [comicId]);

  // Sync progress to backend when component unmounts or page changes significantly
  useEffect(() => {
    if (totalPages === 0) return; // Don't sync if not loaded

    const syncProgress = async () => {
      try {
        await fetch(`http://127.0.0.1:8000/api/comic/${comicId}/progress`, {
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

    // We could debounce this, but doing it on page change is fine for local backend
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
        <div className="reader-error">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  if (isLoading || totalPages === 0) {
    return (
      <div className="reader-overlay">
        <div className="reader-loading">Loading...</div>
      </div>
    );
  }

  const currentImageUrl = `http://127.0.0.1:8000/api/comic/${comicId}/page/${currentPage}`;
  const nextImageUrl1 = currentPage + 1 < totalPages ? `http://127.0.0.1:8000/api/comic/${comicId}/page/${currentPage + 1}` : null;
  const nextImageUrl2 = currentPage + 2 < totalPages ? `http://127.0.0.1:8000/api/comic/${comicId}/page/${currentPage + 2}` : null;

  return (
    <div className="reader-overlay">
      {/* Top Bar */}
      <div className="reader-topbar">
        <button className="reader-close" onClick={onClose}>✕</button>
        <span className="reader-progress">Page {currentPage + 1} of {totalPages}</span>
      </div>

      {/* Main Image */}
      <div className="reader-content" onClick={(e) => {
        // Click right half to go next, left half to go prev
        const rect = e.currentTarget.getBoundingClientRect();
        if (e.clientX > rect.left + rect.width / 2) {
          goToNext();
        } else {
          goToPrev();
        }
      }}>
        <img 
          src={currentImageUrl} 
          alt={`Page ${currentPage + 1}`} 
          className="reader-image"
        />
      </div>

      {/* Pre-fetching engine: Hidden images to force browser cache */}
      <div style={{ display: 'none' }}>
        {nextImageUrl1 && <img src={nextImageUrl1} alt="prefetch 1" />}
        {nextImageUrl2 && <img src={nextImageUrl2} alt="prefetch 2" />}
      </div>
    </div>
  );
};
