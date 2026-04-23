import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Comic, useUIStore } from '../store'

export function ComicCard({ comic }: { comic: Comic }) {
  const { apiPort } = useUIStore()
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)
  const [needsConversion, setNeedsConversion] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    if (!apiPort) return;
    let isMounted = true;
    const fetchThumb = async () => {
      try {
        const resp = await fetch(`http://127.0.0.1:${apiPort}/api/thumb/${comic.id}?t=${reloadTick}`)
        if (resp.status === 422) {
          if (isMounted) setNeedsConversion(true)
        } else if (resp.ok) {
          const blob = await resp.blob()
          const objectUrl = URL.createObjectURL(blob)
          if (isMounted) {
            setThumbUrl(objectUrl)
            setNeedsConversion(false)
          }
        }
      } catch (e) {
        console.error("Failed to load thumb", e)
      }
    }
    fetchThumb()
    return () => { isMounted = false }
  }, [comic.id, apiPort, reloadTick])

  const handleConvert = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!apiPort || isConverting) return;
    setIsConverting(true)
    try {
      const resp = await fetch(`http://127.0.0.1:${apiPort}/api/convert/${comic.id}`, { method: 'POST' })
      if (resp.ok) setReloadTick(t => t + 1)
    } finally {
      setIsConverting(false)
    }
  }

  const handleOpen = async () => {
    try {
      if (comic.file_path) {
        console.log("Opening file via Rust:", comic.file_path);
        await invoke('open_file', { path: comic.file_path });
      }
    } catch (e) {
      console.error("Failed to open file", e);
    }
  }

  return (
    <div className="comic-card" onClick={handleOpen} title={`Open ${comic.file_path}`}>
      <div className="comic-cover">
        {thumbUrl ? (
          <img src={thumbUrl} alt={comic.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : needsConversion ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#331111', padding: '10px', textAlign: 'center' }}>
            <span style={{color: '#ffaaaa', fontSize: '0.8rem', marginBottom: '10px'}}>Proprietary Format (.cbr)</span>
            <button 
              onClick={handleConvert}
              disabled={isConverting}
              style={{ padding: '8px 12px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              {isConverting ? 'Converting...' : 'Convert to CBZ'}
            </button>
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '0.8rem' }}>
            Loading...
          </div>
        )}
      </div>
      <div className="comic-info">
        <h3 className="comic-title">{comic.title || "Unknown Title"}</h3>
        <p className="comic-issue">{comic.series_name} #{comic.issue_number}</p>
      </div>
    </div>
  )
}
