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
        
        {/* Clickable Archive Book on the Rug */}
        <div 
          className="archive-book-trigger"
          onClick={() => setShowArchive(true)}
        >
          <div className="page"></div>
        </div>

        {!libraryPath && (
          <div className="welcome-state" style={{ position: 'absolute', zIndex: 200, background: 'rgba(0,0,0,0.8)', width: '100%', height: '100%' }}>
            <h1>Welcome to Vault</h1>
            <p>To get started, you need to designate a Master Library folder.</p>
            <button onClick={() => setShowSettings(true)} className="btn-primary">Setup Library</button>
          </div>
        )}
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
    </div>
  )
}

export default App
