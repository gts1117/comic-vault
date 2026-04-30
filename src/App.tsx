import { useState } from 'react'
import { ShelfOverlay } from './components/ShelfOverlay'
import { SettingsModal } from './components/SettingsModal'
import { ImportModal } from './components/ImportModal'
import { Reader } from './components/Reader'
import { ArchiveView } from './components/ArchiveView'
import { BoxDetailView } from './components/BoxDetailView'
import { BoxData } from './components/ShelfOverlay'
import { useBackend } from './hooks/useBackend'
import { useUIStore, useLibraryStore } from './store'
import './App.css'

function MaskTuner() {
  const [masks, setMasks] = useState([
    { start: 0, end: 9 },
    { start: 36, end: 40 },
    { start: 57, end: 64 },
    { start: 92, end: 100 }
  ]);

  const updateMask = (index: number, field: 'start'|'end', value: number) => {
    const newMasks = [...masks];
    newMasks[index][field] = value;
    setMasks(newMasks);
  };

  return (
    <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 9999, background: 'rgba(0,0,0,0.85)', padding: 20, borderRadius: 8, color: 'white', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <style>{`
        ${masks.map((m, i) => `
          .room-fg-mask-${i+1} { 
            clip-path: inset(0 ${100 - m.end}% 0 ${m.start}%) !important; 
            background: rgba(255, 0, 0, 0.2) !important;
            border-left: 2px solid red; 
            border-right: 2px solid red; 
          }
        `).join('')}
      `}</style>
      <div style={{ display: 'flex', gap: '20px' }}>
        {masks.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <strong>Mask {i+1}</strong>
            <div>Start: {m.start}% <br/><input type="range" min="0" max="100" step="0.1" value={m.start} onChange={e => updateMask(i, 'start', parseFloat(e.target.value))} style={{width:'120px'}}/></div>
            <div>End: {m.end}% <br/><input type="range" min="0" max="100" step="0.1" value={m.end} onChange={e => updateMask(i, 'end', parseFloat(e.target.value))} style={{width:'120px'}}/></div>
          </div>
        ))}
      </div>
      <pre style={{ margin: 0, fontSize: 11, background: '#000', padding: 10 }}>
{masks.map((m, i) => `.room-fg-mask-${i+1} { clip-path: inset(0 ${+(100 - m.end).toFixed(1)}% 0 ${m.start}%); }`).join('\n')}
      </pre>
    </div>
  )
}

function App() {
  useBackend()
  const { libraryPath, activeComicId, setActiveComicId } = useUIStore()
  const { comics } = useLibraryStore()
  
  const [showSettings, setShowSettings] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const [activeBox, setActiveBox] = useState<BoxData | null>(null)

  return (
    <div className="app-container">
      <div className="room-stage">
        <ShelfOverlay 
          onBoxClick={(box) => {
            setActiveBox(box);
          }}
        />

        {/* Archive Book — only show when library is loaded */}
        {libraryPath && (
          <div
            className="archive-book-trigger"
            onClick={() => setShowArchive(true)}
          >
            <div className="page-flip">
              <div className="page-front" />
              <div className="page-back" />
            </div>
          </div>
        )}

        {!libraryPath && (
          <div className="welcome-state" style={{ position: 'absolute', zIndex: 300, background: 'rgba(0,0,0,0.8)', width: '100%', height: '100%' }}>
            <h1>Welcome to Vault</h1>
            <p>To get started, you need to designate a Master Library folder.</p>
            <button onClick={() => setShowSettings(true)} className="btn-primary">Setup Library</button>
          </div>
        )}
        {/* Foreground occlusion masks */}
        <div className="room-fg-mask room-fg-mask-1" />
        <div className="room-fg-mask room-fg-mask-2" />
        <div className="room-fg-mask room-fg-mask-3" />
        <div className="room-fg-mask room-fg-mask-4" />
      </div>

      {/* Minimal HUD overlaying the room */}
      <div className="hud-overlay">
        <button className="hud-btn" onClick={() => setShowImport(true)}>📥 Import</button>
        <button className="hud-btn" onClick={() => setShowSettings(true)}>⚙️ Settings</button>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      {showArchive && (
        <ArchiveView 
          onClose={() => setShowArchive(false)} 
          onSelectComic={(id) => {
            setActiveComicId(id);
            setShowArchive(false);
          }} 
        />
      )}
      {activeBox && (
        <BoxDetailView 
          box={activeBox} 
          onClose={() => setActiveBox(null)} 
          onSelectComic={(id) => {
            setActiveComicId(id);
          }} 
        />
      )}
      {activeComicId !== null && <Reader comicId={activeComicId} onClose={() => setActiveComicId(null)} />}
      <MaskTuner />
    </div>
  )
}

export default App
