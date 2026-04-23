import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { CategorizedGrid } from './components/CategorizedGrid'
import { SettingsModal } from './components/SettingsModal'
import { ImportModal } from './components/ImportModal'
import { useBackend } from './hooks/useBackend'
import { useUIStore } from './store'
import './App.css'

function App() {
  useBackend()
  const { libraryPath } = useUIStore()
  
  const [showSettings, setShowSettings] = useState(false)
  const [showImport, setShowImport] = useState(false)

  return (
    <div className="app-container">
      <Sidebar 
        onOpenSettings={() => setShowSettings(true)} 
        onOpenImport={() => setShowImport(true)} 
      />
      
      <main className="main-content">
        {!libraryPath ? (
          <div className="welcome-state">
            <h1>Welcome to Vault</h1>
            <p>To get started, you need to designate a Master Library folder.</p>
            <button onClick={() => setShowSettings(true)} className="btn-primary">Setup Library</button>
          </div>
        ) : (
          <>
            <div className="top-bar">
              <input type="text" placeholder="Search your longbox..." className="search-input" />
            </div>
            <CategorizedGrid />
          </>
        )}
      </main>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    </div>
  )
}

export default App
