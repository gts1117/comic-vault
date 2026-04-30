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
  const [L, setL] = useState(9); // Shows 0 to 9.
  const [C1, setC1] = useState(57); // Center starts at 57.
  const [C2, setC2] = useState(64); // Center ends at 64.
  const [R, setR] = useState(92); // Right starts at 92.

  return (
    <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 9999, background: 'rgba(0,0,0,0.85)', padding: 20, borderRadius: 8, color: 'white' }}>
      <style>{`
        .room-fg-left { clip-path: inset(0 ${100 - L}% 0 0) !important; border-right: 1px dashed red; }
        .room-fg-center-col { clip-path: inset(0 ${100 - C2}% 0 ${C1}%) !important; border-left: 1px dashed red; border-right: 1px dashed red; }
        .room-fg-right { clip-path: inset(0 0 0 ${R}%) !important; border-left: 1px dashed red; }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>Left Mask Edge: {L}% <br/><input type="range" min="0" max="25" step="0.1" value={L} onChange={e => setL(parseFloat(e.target.value))} style={{width:'200px'}}/></div>
        <div>Center Mask Start: {C1}% <br/><input type="range" min="45" max="65" step="0.1" value={C1} onChange={e => setC1(parseFloat(e.target.value))} style={{width:'200px'}}/></div>
        <div>Center Mask End: {C2}% <br/><input type="range" min="55" max="75" step="0.1" value={C2} onChange={e => setC2(parseFloat(e.target.value))} style={{width:'200px'}}/></div>
        <div>Right Mask Start: {R}% <br/><input type="range" min="80" max="100" step="0.1" value={R} onChange={e => setR(parseFloat(e.target.value))} style={{width:'200px'}}/></div>
      </div>
      <pre style={{ marginTop: 15, fontSize: 11, background: '#000', padding: 10 }}>
{`.room-fg-left        { clip-path: inset(0 ${+(100 - L).toFixed(1)}% 0 0); }
.room-fg-center-col  { clip-path: inset(0 ${+(100 - C2).toFixed(1)}% 0 ${C1}%); }
.room-fg-right       { clip-path: inset(0 0 0 ${R}%); }`}
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
        {/* Foreground occlusion masks — background-image divs align pixel-perfect with room-stage */}
        <div className="room-fg-mask room-fg-left" />
        <div className="room-fg-mask room-fg-center-col" />
        <div className="room-fg-mask room-fg-right" />
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
