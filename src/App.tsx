import { useState } from 'react'
import { ShelfOverlay } from './components/ShelfOverlay'
import { SettingsModal } from './components/SettingsModal'
import { ImportModal } from './components/ImportModal'
import { Reader } from './components/Reader'
import { ArchiveView } from './components/ArchiveView'
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

  return (
    <div className="app-container">
      <div className="room-stage">
        <ShelfOverlay 
          boxes={[
            { id: '1', label: 'X-MEN' },
            { id: '2', label: 'SPIDER-MAN' },
            { id: '3', label: 'BATMAN' },
            { id: '4', label: 'AVENGERS' },
            { id: '5', label: 'IMAGE COMICS' },
            { id: '6', label: 'VERTIGO' },
            { id: '7', label: 'DARK HORSE' },
            { id: '8', label: 'IDW' },
            { id: '9', label: 'BOOM!' },
            { id: '10', label: 'VALIANT' },
            { id: '11', label: 'MANGA' },
            { id: '12', label: 'INDIE' },
            { id: '13', label: 'ACTION COMICS' },
            { id: '14', label: 'DETECTIVE' },
            { id: '15', label: 'SUPERMAN' },
            { id: '16', label: 'FLASH' },
            { id: '17', label: 'GREEN LANTERN' },
            { id: '18', label: 'JUSTICE LEAGUE' },
            { id: '19', label: 'WONDER WOMAN' },
            { id: '20', label: 'AQUAMAN' },
            { id: '21', label: 'DAREDEVIL' },
            { id: '22', label: 'PUNISHER' },
            { id: '23', label: 'FANTASTIC FOUR' },
            { id: '24', label: 'IRON MAN' },
            { id: '25', label: 'THOR' },
            { id: '26', label: 'HULK' },
            { id: '27', label: 'CAPTAIN AMERICA' },
            { id: '28', label: 'BOX 28' },
            { id: '29', label: 'BOX 29' },
            { id: '30', label: 'BOX 30' },
          ]}
          onBoxClick={(box) => {
            if (comics && comics.length > 0) {
              setActiveComicId(comics[0].id)
            } else {
              console.warn('No comics loaded in library yet!')
            }
          }}
        />
        
        {/* Clickable Archive Book on the Rug */}
        <div 
          className="archive-book-trigger"
          onClick={() => setShowArchive(true)}
          style={{
            position: 'absolute',
            bottom: '15%',
            left: '28%',
            width: '12%',
            height: '8%',
            cursor: 'pointer',
            zIndex: 50,
            transform: 'perspective(500px) rotateX(60deg) rotateZ(10deg)',
          }}
        />

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
      {activeComicId !== null && <Reader comicId={activeComicId} onClose={() => setActiveComicId(null)} />}
    </div>
  )
}

export default App
